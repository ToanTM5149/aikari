"""
API routes for test management
"""
import uuid
import random
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func, and_, or_

from app.api.deps import CurrentUser, SessionDep
from app.models.test import (
    Test,
    TestQuestion,
    TestAttempt,
    TestAnswer,
    ReattemptRequest,
)
from app.models.term import Term
from app.models.studyset import StudySet
from app.models.class_ import Class, ClassMember, ClassStudySet
from app.models.enums import QuestionType, ReattemptStatus, ClassRole, MembershipStatus
from app.schemas.test import (
    TestCreate,
    TestUpdate,
    TestPublic,
    TestWithQuestions,
    TestsPublic,
    AttemptCreate,
    AttemptSubmit,
    AttemptPublic,
    AttemptWithAnswers,
    AttemptWithTestInfo,
    AttemptWithQuestionsOnly,
    AttemptsPublic,
    QuestionPublic,
    QuestionWithoutAnswer,
    AnswerPublic,
    ReattemptRequestCreate,
    ReattemptRequestPublic,
    ReattemptRequestUpdate,
    ReattemptRequestsPublic,
)
from app.schemas.common import Message

router = APIRouter()


def check_studyset_access(
    session: Session,
    studyset_id: uuid.UUID,
    user_id: uuid.UUID,
) -> StudySet:
    """Check if user has access to studyset and return it"""
    studyset = session.get(StudySet, studyset_id)
    if not studyset:
        raise HTTPException(status_code=404, detail="Study set not found")
    
    # Owner always has access
    if studyset.owner_id == user_id:
        return studyset
    
    # Check class membership
    class_access = session.exec(
        select(ClassMember)
        .join(Class)
        .where(
            ClassMember.user_id == user_id,
            ClassMember.class_id == Class.class_id,
        )
    ).first()
    
    if not class_access:
        raise HTTPException(
            status_code=403,
            detail="You don't have access to this study set"
        )
    
    return studyset


def check_class_role(
    session: Session,
    class_id: uuid.UUID,
    user_id: uuid.UUID,
) -> tuple[ClassMember, bool]:
    """Check user's role in class. Returns (membership, is_owner_or_coteacher)"""
    membership = session.exec(
        select(ClassMember).where(
            ClassMember.class_id == class_id,
            ClassMember.user_id == user_id
        )
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this class")
    
    is_owner_or_coteacher = membership.role in [ClassRole.OWNER, ClassRole.CO_TEACHER]
    return membership, is_owner_or_coteacher


def generate_test_questions(
    session: Session,
    studyset_id: uuid.UUID,
    total_questions: int,
    question_types: list[str],
) -> list[dict]:
    """Generate questions for a test"""
    # Get all terms from studyset
    terms = session.exec(
        select(Term).where(Term.studyset_id == studyset_id)
    ).all()
    
    if not terms:
        raise HTTPException(status_code=400, detail="No terms available in study set")
    
    if len(terms) < total_questions:
        total_questions = len(terms)
    
    # Randomly select terms
    selected_terms = random.sample(terms, total_questions)
    
    questions = []
    for i, term in enumerate(selected_terms):
        # Determine question type
        if not question_types:
            question_type = QuestionType.MULTIPLE_CHOICE
        else:
            question_type = random.choice([QuestionType(qt) for qt in question_types])
        
        question_data = {
            "term_id": term.term_id,
            "question_type": question_type,
            "order": i,
        }
        
        if question_type == QuestionType.TRUE_FALSE:
            # Generate true/false question
            is_correct = random.choice([True, False])
            if is_correct:
                question_data["question_text"] = f"Định nghĩa của '{term.term_text}' là: {term.definition}"
                question_data["correct_answer"] = "true"
            else:
                # Get a wrong definition from another term
                other_terms = [t for t in terms if t.term_id != term.term_id]
                if other_terms:
                    wrong_term = random.choice(other_terms)
                    question_data["question_text"] = f"Định nghĩa của '{term.term_text}' là: {wrong_term.definition}"
                else:
                    question_data["question_text"] = f"Định nghĩa của '{term.term_text}' là: {term.definition}"
                question_data["correct_answer"] = "false"
            question_data["options"] = ["true", "false"]
            
        elif question_type == QuestionType.ESSAY:
            # Essay question - ask for term or definition
            ask_for_term = random.choice([True, False])
            if ask_for_term:
                question_data["question_text"] = f"Thuật ngữ nào có định nghĩa: {term.definition}"
                question_data["correct_answer"] = term.term_text.lower().strip()
            else:
                question_data["question_text"] = f"Định nghĩa của '{term.term_text}' là gì?"
                question_data["correct_answer"] = term.definition.lower().strip()
            question_data["options"] = None
            
        else:  # MULTIPLE_CHOICE
            # Multiple choice - give definition, ask for term
            question_data["question_text"] = f"Thuật ngữ nào có định nghĩa: {term.definition}"
            question_data["correct_answer"] = term.term_text
            
            # Generate wrong options
            other_terms = [t for t in terms if t.term_id != term.term_id]
            wrong_options = random.sample(
                [t.term_text for t in other_terms],
                min(3, len(other_terms))
            )
            
            options = [term.term_text] + wrong_options
            random.shuffle(options)
            question_data["options"] = options
        
        questions.append(question_data)
    
    return questions


@router.post("/studysets/{studyset_id}/tests/", response_model=TestWithQuestions)
def create_test(
    studyset_id: uuid.UUID,
    test_data: TestCreate,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Create a new test for a study set.
    Only owners can create tests.
    """
    # Check access
    studyset = check_studyset_access(session, studyset_id, current_user.user_id)
    
    # Only owner can create tests
    if studyset.owner_id != current_user.user_id:
        raise HTTPException(
            status_code=403,
            detail="Only study set owners can create tests"
        )
    
    # Create test
    test = Test(
        studyset_id=studyset_id,
        title=test_data.title,
        description=test_data.description,
        total_questions=test_data.total_questions,
        show_answers=test_data.show_answers,
        question_types=test_data.question_types,
        time_limit=test_data.time_limit,
        created_by=current_user.user_id,
    )
    session.add(test)
    session.flush()
    
    # Generate questions
    questions_data = generate_test_questions(
        session,
        studyset_id,
        test_data.total_questions,
        test_data.question_types,
    )
    
    # Create question records
    for q_data in questions_data:
        question = TestQuestion(
            test_id=test.test_id,
            **q_data
        )
        session.add(question)
    
    session.commit()
    session.refresh(test)
    
    # Query questions from DB to ensure all data is loaded
    loaded_questions = session.exec(
        select(TestQuestion)
        .where(TestQuestion.test_id == test.test_id)
        .order_by(TestQuestion.order)
    ).all()
    
    # Return test with questions
    return TestWithQuestions(
        **test.model_dump(),
        questions=[QuestionPublic(**q.model_dump()) for q in loaded_questions]
    )


@router.get("/studysets/{studyset_id}/tests/", response_model=TestsPublic)
def get_tests_for_studyset(
    studyset_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Get all tests for a study set
    """
    # Check access
    check_studyset_access(session, studyset_id, current_user.user_id)
    
    # Get tests
    tests = session.exec(
        select(Test)
        .where(Test.studyset_id == studyset_id)
        .order_by(Test.created_at.desc())
        .offset(skip)
        .limit(limit)
    ).all()
    
    count = session.exec(
        select(func.count(Test.test_id)).where(Test.studyset_id == studyset_id)
    ).one()
    
    return TestsPublic(
        data=[TestPublic(**test.model_dump()) for test in tests],
        count=count
    )


@router.get("/tests/{test_id}/", response_model=TestWithQuestions)
def get_test(
    test_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Get test details with questions (without correct answers unless completed)
    """
    test = session.get(Test, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    # Check access
    check_studyset_access(session, test.studyset_id, current_user.user_id)
    
    # Get questions
    questions = session.exec(
        select(TestQuestion)
        .where(TestQuestion.test_id == test_id)
        .order_by(TestQuestion.order)
    ).all()
    
    return TestWithQuestions(
        **test.model_dump(),
        questions=[QuestionPublic(**q.model_dump()) for q in questions]
    )


@router.delete("/tests/{test_id}/", response_model=Message)
def delete_test(
    test_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Delete a test. Only creator can delete.
    """
    test = session.get(Test, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    # Only creator can delete
    if test.created_by != current_user.user_id:
        raise HTTPException(
            status_code=403,
            detail="Only test creator can delete"
        )
    
    session.delete(test)
    session.commit()
    
    return Message(message="Test deleted successfully")


# Attempt routes
@router.post("/tests/{test_id}/attempts/", response_model=AttemptWithQuestionsOnly)
def start_test_attempt(
    test_id: uuid.UUID,
    attempt_data: AttemptCreate,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Start a new test attempt.
    For class members, check if they already have a completed attempt.
    """
    test = session.get(Test, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    # Check access
    check_studyset_access(session, test.studyset_id, current_user.user_id)
    
    # Check if user is owner of the test
    is_test_owner = test.created_by == current_user.user_id
    
    # If test owner, allow reattempt by deleting old completed attempts
    if is_test_owner:
        existing_attempts = session.exec(
            select(TestAttempt).where(
                TestAttempt.test_id == test_id,
                TestAttempt.user_id == current_user.user_id,
                TestAttempt.is_completed == True
            )
        ).all()
        
        for old_attempt in existing_attempts:
            # Delete associated reattempt requests if any
            reattempts = session.exec(
                select(ReattemptRequest).where(
                    ReattemptRequest.attempt_id == old_attempt.attempt_id
                )
            ).all()
            for req in reattempts:
                session.delete(req)
            session.delete(old_attempt)
        
        if existing_attempts:
            session.commit()
    
    # Determine class_id for the attempt
    # 1. If provided in request, use it
    # 2. Otherwise, find class where user is member and studyset belongs to
    # 3. If user is studyset owner, class_id can be None (can reattempt freely)
    determined_class_id = attempt_data.class_id
    
    if not determined_class_id:
        # Find class where user is active member and studyset belongs to
        class_studyset = session.exec(
            select(ClassStudySet)
            .join(ClassMember, ClassMember.class_id == ClassStudySet.class_id)
            .where(ClassStudySet.studyset_id == test.studyset_id)
            .where(ClassMember.user_id == current_user.user_id)
            .where(ClassMember.status == MembershipStatus.ACTIVE)
        ).first()
        
        if class_studyset:
            determined_class_id = class_studyset.class_id
    
    # Check if accessed through class
    if determined_class_id:
        membership, is_owner_or_coteacher = check_class_role(
            session, determined_class_id, current_user.user_id
        )
        
        # If member (not owner/coteacher) and not test owner, check for existing attempts
        if not is_owner_or_coteacher and not is_test_owner:
            existing_attempt = session.exec(
                select(TestAttempt).where(
                    TestAttempt.test_id == test_id,
                    TestAttempt.user_id == current_user.user_id,
                    TestAttempt.class_id == determined_class_id,
                    TestAttempt.is_completed == True
                )
            ).first()
            
            if existing_attempt:
                # Check if there's an approved reattempt request
                reattempt = session.exec(
                    select(ReattemptRequest).where(
                        ReattemptRequest.attempt_id == existing_attempt.attempt_id,
                        ReattemptRequest.status == ReattemptStatus.APPROVED
                    )
                ).first()
                
                if not reattempt:
                    raise HTTPException(
                        status_code=403,
                        detail="You have already completed this test. Request a reattempt from your teacher."
                    )
                
                # Delete old attempt and request
                session.delete(existing_attempt)
                session.delete(reattempt)
                session.commit()
    
    # Create attempt
    attempt = TestAttempt(
        test_id=test_id,
        user_id=current_user.user_id,
        class_id=determined_class_id,
        total_questions=test.total_questions,
    )
    session.add(attempt)
    session.commit()
    session.refresh(attempt)
    
    # Get questions without correct answers
    questions = session.exec(
        select(TestQuestion)
        .where(TestQuestion.test_id == test_id)
        .order_by(TestQuestion.order)
    ).all()
    
    return AttemptWithQuestionsOnly(
        **attempt.model_dump(),
        questions=[
            QuestionWithoutAnswer(
                question_id=q.question_id,
                test_id=q.test_id,
                term_id=q.term_id,
                question_type=q.question_type,
                question_text=q.question_text,
                options=q.options,
                order=q.order
            )
            for q in questions
        ]
    )


@router.post("/attempts/{attempt_id}/submit/", response_model=AttemptWithAnswers)
def submit_test_attempt(
    attempt_id: uuid.UUID,
    submission: AttemptSubmit,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Submit answers for a test attempt
    """
    attempt = session.get(TestAttempt, attempt_id)
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    if attempt.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not your attempt")
    
    if attempt.is_completed:
        raise HTTPException(status_code=400, detail="Attempt already completed")
    
    # Get all questions
    questions = session.exec(
        select(TestQuestion)
        .where(TestQuestion.test_id == attempt.test_id)
        .order_by(TestQuestion.order)
    ).all()
    
    questions_dict = {q.question_id: q for q in questions}
    
    # Grade answers
    correct_count = 0
    answers = []
    
    for answer_data in submission.answers:
        question = questions_dict.get(answer_data.question_id)
        if not question:
            continue
        
        user_answer = answer_data.user_answer.lower().strip() if answer_data.user_answer else ""
        correct_answer = question.correct_answer.lower().strip()
        
        # Check correctness
        is_correct = False
        if question.question_type == QuestionType.ESSAY:
            # For essay, check if answer contains correct answer or vice versa
            is_correct = (
                correct_answer in user_answer or
                user_answer in correct_answer or
                user_answer == correct_answer
            )
        else:
            is_correct = user_answer == correct_answer
        
        if is_correct:
            correct_count += 1
        
        answer = TestAnswer(
            attempt_id=attempt_id,
            question_id=answer_data.question_id,
            user_answer=answer_data.user_answer,
            is_correct=is_correct
        )
        session.add(answer)
        answers.append(answer)
    
    # Update attempt
    attempt.correct_answers = correct_count
    attempt.score = (correct_count / attempt.total_questions * 100) if attempt.total_questions > 0 else 0
    attempt.is_completed = True
    attempt.completed_at = datetime.utcnow()
    
    session.commit()
    session.refresh(attempt)
    
    # Query answers from DB to ensure all data is loaded
    db_answers = session.exec(
        select(TestAnswer)
        .where(TestAnswer.attempt_id == attempt_id)
    ).all()
    
    # Query questions from DB to ensure all data is loaded
    db_questions = session.exec(
        select(TestQuestion)
        .where(TestQuestion.test_id == attempt.test_id)
        .order_by(TestQuestion.order)
    ).all()
    
    # Return with answers and questions
    return AttemptWithAnswers(
        **attempt.model_dump(),
        answers=[AnswerPublic(**a.model_dump()) for a in db_answers],
        questions=[QuestionPublic(**q.model_dump()) for q in db_questions]
    )


@router.get("/attempts/my-history/", response_model=AttemptsPublic)
def get_my_test_history(
    session: SessionDep,
    current_user: CurrentUser,
    class_id: uuid.UUID | None = Query(None, description="Filter by class"),
    test_creator_id: str | None = Query(None, description="Filter by test creator (user gen). Use special value 'AI' for AI-generated tests."),
    search: str | None = Query(None, description="Search by test title"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
) -> Any:
    """
    Get user's test history with filters.
    For non-owners: only show latest attempt per studyset.
    For owners: show all attempts.
    Returns attempts with enriched test, studyset, and class information.
    """
    from app.models import StudySet, User
    
    # Base query for all user's completed attempts
    base_query = (
        select(TestAttempt)
        .join(Test, TestAttempt.test_id == Test.test_id)
        .where(
            TestAttempt.user_id == current_user.user_id,
            TestAttempt.is_completed == True
        )
    )
    
    # Apply filters
    if class_id:
        base_query = base_query.where(TestAttempt.class_id == class_id)
    
    if test_creator_id is not None:
        # Check if it's a special value for AI-generated tests
        # For now, AI-generated tests don't exist, so return empty
        # In the future, you can check if test_creator_id is a special AI user ID
        if str(test_creator_id).upper() == "AI":
            # AI-generated tests not implemented yet, return empty
            return AttemptsPublic(data=[], count=0)
        else:
            # Try to parse as UUID for test creator filter
            try:
                creator_uuid = uuid.UUID(test_creator_id)
                base_query = base_query.where(Test.created_by == creator_uuid)
            except ValueError:
                # Invalid UUID, return empty
                return AttemptsPublic(data=[], count=0)
    
    if search:
        base_query = base_query.where(Test.title.ilike(f"%{search}%"))
    
    # Get all attempts matching filters
    all_attempts = session.exec(
        base_query.order_by(TestAttempt.completed_at.desc())
    ).all()
    
    # Group by studyset_id and check ownership
    studyset_attempts: dict[uuid.UUID, list[TestAttempt]] = {}
    studyset_owners: dict[uuid.UUID, bool] = {}
    
    for attempt in all_attempts:
        test = session.get(Test, attempt.test_id)
        if not test:
            continue
        
        studyset_id = test.studyset_id
        
        # Check if user is owner of this studyset (cache it)
        if studyset_id not in studyset_owners:
            studyset = session.get(StudySet, studyset_id)
            studyset_owners[studyset_id] = studyset.owner_id == current_user.user_id if studyset else False
        
        if studyset_id not in studyset_attempts:
            studyset_attempts[studyset_id] = []
        
        studyset_attempts[studyset_id].append(attempt)
    
    # Filter attempts based on ownership
    filtered_attempts = []
    for studyset_id, attempts in studyset_attempts.items():
        is_owner = studyset_owners[studyset_id]
        
        if is_owner:
            # Owner: show all attempts
            filtered_attempts.extend(attempts)
        else:
            # Non-owner: show only latest attempt per studyset
            latest = max(attempts, key=lambda a: a.completed_at or a.started_at)
            filtered_attempts.append(latest)
    
    # Sort by completed_at descending
    filtered_attempts.sort(key=lambda a: a.completed_at or a.started_at, reverse=True)
    
    # Apply pagination
    total_count = len(filtered_attempts)
    paginated_attempts = filtered_attempts[skip:skip + limit]
    
    # Enrich attempts with test, studyset, class, and creator info
    enriched_attempts = []
    for attempt in paginated_attempts:
        test = session.get(Test, attempt.test_id)
        if not test:
            continue
        
        studyset = session.get(StudySet, test.studyset_id)
        test_creator = session.get(User, test.created_by)
        
        class_info = None
        if attempt.class_id:
            class_obj = session.get(Class, attempt.class_id)
            if class_obj:
                class_info = class_obj
        
        attempt_dict = attempt.model_dump()
        attempt_dict['test_title'] = test.title
        attempt_dict['test_description'] = test.description
        attempt_dict['studyset_id'] = test.studyset_id
        attempt_dict['studyset_title'] = studyset.title if studyset else None
        attempt_dict['class_id'] = attempt.class_id
        attempt_dict['class_name'] = class_info.class_name if class_info else None
        attempt_dict['test_creator_id'] = test.created_by
        attempt_dict['test_creator_username'] = test_creator.username if test_creator else None
        
        enriched_attempts.append(AttemptWithTestInfo(**attempt_dict))
    
    # Create a custom response with enriched data
    return AttemptsPublic(
        data=enriched_attempts,  # type: ignore
        count=total_count
    )


# Note: This route must be defined AFTER /attempts/my-history/ to avoid path matching conflicts
@router.get("/attempts/{attempt_id}/", response_model=AttemptWithAnswers)
def get_attempt_result(
    attempt_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Get attempt result with answers and correct answers
    """
    attempt = session.get(TestAttempt, attempt_id)
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    # Check access - user must be owner or participant
    test = session.get(Test, attempt.test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    studyset = session.get(StudySet, test.studyset_id)
    
    is_owner = studyset.owner_id == current_user.user_id
    is_participant = attempt.user_id == current_user.user_id
    is_class_teacher = False
    
    if attempt.class_id:
        membership = session.exec(
            select(ClassMember).where(
                ClassMember.class_id == attempt.class_id,
                ClassMember.user_id == current_user.user_id,
                or_(
                    ClassMember.role == ClassRole.OWNER,
                    ClassMember.role == ClassRole.CO_TEACHER
                )
            )
        ).first()
        is_class_teacher = membership is not None
    
    if not (is_owner or is_participant or is_class_teacher):
        raise HTTPException(status_code=403, detail="Access denied")
    
    if not attempt.is_completed:
        raise HTTPException(status_code=400, detail="Attempt not completed yet")
    
    # Get answers and questions
    answers = session.exec(
        select(TestAnswer).where(TestAnswer.attempt_id == attempt_id)
    ).all()
    
    questions = session.exec(
        select(TestQuestion)
        .where(TestQuestion.test_id == attempt.test_id)
        .order_by(TestQuestion.order)
    ).all()
    
    return AttemptWithAnswers(
        **attempt.model_dump(),
        answers=[AnswerPublic(**a.model_dump()) for a in answers],
        questions=[QuestionPublic(**q.model_dump()) for q in questions]
    )


@router.get("/tests/{test_id}/my-attempts/", response_model=AttemptsPublic)
def get_my_attempts(
    test_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
    class_id: uuid.UUID | None = None,
) -> Any:
    """
    Get user's attempts for a test
    """
    test = session.get(Test, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    query = select(TestAttempt).where(
        TestAttempt.test_id == test_id,
        TestAttempt.user_id == current_user.user_id
    )
    
    if class_id:
        query = query.where(TestAttempt.class_id == class_id)
    
    attempts = session.exec(
        query.order_by(TestAttempt.started_at.desc())
    ).all()
    
    return AttemptsPublic(
        data=[AttemptPublic(**a.model_dump()) for a in attempts],
        count=len(attempts)
    )


# Reattempt request routes
@router.post("/reattempt-requests/", response_model=ReattemptRequestPublic)
def create_reattempt_request(
    request_data: ReattemptRequestCreate,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Create a reattempt request for a completed attempt
    """
    attempt = session.get(TestAttempt, request_data.attempt_id)
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    if attempt.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not your attempt")
    
    if not attempt.is_completed:
        raise HTTPException(status_code=400, detail="Attempt not completed")
    
    # Get test and studyset to check ownership
    test = session.get(Test, attempt.test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    studyset = session.get(StudySet, test.studyset_id)
    if not studyset:
        raise HTTPException(status_code=404, detail="Study set not found")
    
    # If user is studyset owner, they can reattempt directly (no need for request)
    if studyset.owner_id == current_user.user_id:
        raise HTTPException(
            status_code=400,
            detail="As the study set owner, you can reattempt this test directly without creating a request. Please use the 'Làm lại' button."
        )
    
    # Reattempt requests are only for class-based attempts
    if not attempt.class_id:
        raise HTTPException(
            status_code=400,
            detail="Reattempt requests are only available for class-based attempts. Please contact the study set owner."
        )
    
    # Check if request already exists (any status)
    existing = session.exec(
        select(ReattemptRequest).where(
            ReattemptRequest.attempt_id == request_data.attempt_id
        )
    ).first()
    
    if existing:
        if existing.status == ReattemptStatus.PENDING:
            raise HTTPException(
                status_code=400, 
                detail="A pending reattempt request already exists for this attempt"
            )
        elif existing.status == ReattemptStatus.APPROVED:
            raise HTTPException(
                status_code=400,
                detail="This reattempt request has already been approved. You can now reattempt the test."
            )
        elif existing.status == ReattemptStatus.REJECTED:
            # Allow creating a new request if the previous one was rejected
            # Delete the old rejected request first
            session.delete(existing)
            session.commit()
        else:
            raise HTTPException(
                status_code=400,
                detail="A reattempt request already exists for this attempt"
            )
    
    # Create request
    request = ReattemptRequest(
        attempt_id=request_data.attempt_id,
        user_id=current_user.user_id,
        class_id=attempt.class_id,
    )
    session.add(request)
    session.commit()
    session.refresh(request)
    
    return ReattemptRequestPublic(**request.model_dump())


@router.get("/classes/{class_id}/reattempt-requests/", response_model=ReattemptRequestsPublic)
def get_reattempt_requests_for_class(
    class_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
    status: ReattemptStatus | None = None,
) -> Any:
    """
    Get reattempt requests for a class.
    Only owners and co-teachers can view.
    """
    # Check role
    membership, is_owner_or_coteacher = check_class_role(
        session, class_id, current_user.user_id
    )
    
    if not is_owner_or_coteacher:
        raise HTTPException(
            status_code=403,
            detail="Only owners and co-teachers can view requests"
        )
    
    query = select(ReattemptRequest).where(ReattemptRequest.class_id == class_id)
    
    if status:
        query = query.where(ReattemptRequest.status == status)
    
    requests = session.exec(
        query.order_by(ReattemptRequest.requested_at.desc())
    ).all()
    
    # Load attempt and test information for each request
    enriched_requests = []
    for req in requests:
        attempt = session.get(TestAttempt, req.attempt_id)
        if attempt:
            test = session.get(Test, attempt.test_id)
            if test:
                # Create enriched request with test info
                request_dict = req.model_dump()
                request_dict['test_title'] = test.title
                request_dict['test_id'] = test.test_id
                request_dict['studyset_id'] = test.studyset_id
                request_dict['attempt_score'] = attempt.score
                request_dict['attempt_correct_answers'] = attempt.correct_answers
                request_dict['attempt_total_questions'] = attempt.total_questions
                request_dict['attempt_completed_at'] = attempt.completed_at
                enriched_requests.append(request_dict)
    
    return ReattemptRequestsPublic(
        data=[ReattemptRequestPublic(**r) for r in enriched_requests],
        count=len(enriched_requests)
    )


@router.get("/reattempt-requests/attempt/{attempt_id}/", response_model=ReattemptRequestPublic | None)
def get_reattempt_request_by_attempt(
    attempt_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Get reattempt request for a specific attempt.
    User can only view their own requests.
    """
    attempt = session.get(TestAttempt, attempt_id)
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    if attempt.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not your attempt")
    
    request = session.exec(
        select(ReattemptRequest).where(
            ReattemptRequest.attempt_id == attempt_id
        )
    ).first()
    
    if not request:
        return None
    
    # Enrich with test and attempt info
    test = session.get(Test, attempt.test_id)
    if test:
        request_dict = request.model_dump()
        request_dict['test_title'] = test.title
        request_dict['test_id'] = test.test_id
        request_dict['studyset_id'] = test.studyset_id
        request_dict['attempt_score'] = attempt.score
        request_dict['attempt_correct_answers'] = attempt.correct_answers
        request_dict['attempt_total_questions'] = attempt.total_questions
        request_dict['attempt_completed_at'] = attempt.completed_at
        return ReattemptRequestPublic(**request_dict)
    
    return ReattemptRequestPublic(**request.model_dump())


@router.put("/reattempt-requests/{request_id}/", response_model=ReattemptRequestPublic)
def update_reattempt_request(
    request_id: uuid.UUID,
    update_data: ReattemptRequestUpdate,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Approve or reject a reattempt request.
    Only owners and co-teachers can update.
    """
    request = session.get(ReattemptRequest, request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Check role
    membership, is_owner_or_coteacher = check_class_role(
        session, request.class_id, current_user.user_id
    )
    
    if not is_owner_or_coteacher:
        raise HTTPException(
            status_code=403,
            detail="Only owners and co-teachers can review requests"
        )
    
    # Update request
    request.status = update_data.status
    request.reviewed_by = current_user.user_id
    request.reviewed_at = datetime.utcnow()
    
    session.commit()
    session.refresh(request)
    
    return ReattemptRequestPublic(**request.model_dump())
