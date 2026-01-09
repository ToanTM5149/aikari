"""
Seed Test Data Script
Creates test users, studysets, terms, and classes for testing
"""
import sys
import os
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlmodel import Session, select, delete
from app.core.db import engine
from app.models import (
    User, StudySet, Term, Class, ClassMember, ClassStudySet, 
    UserRole, ClassRole, MembershipStatus,
    TestAttempt, ReattemptRequest, Test,
    ProgressSummary, StudyActivity, AIGeneratedContents, Attribute,
    ChatConversation, Category
)
from app.core.security import get_password_hash
import uuid
from datetime import datetime

# Category data - 3 categories
CATEGORY_DATA = [
    {
        "name": "Science",
        "description": "Natural sciences and scientific concepts",
        "color": "#3B82F6"  # Blue
    },
    {
        "name": "Language",
        "description": "Languages and vocabulary",
        "color": "#10B981"  # Green
    },
    {
        "name": "Programming",
        "description": "Programming and information technology",
        "color": "#F59E0B"  # Orange
    },
]

# Test data: Topics and their terms
# Format: (term_text, definition, example, image_url)
# 8 Study Sets với mỗi cái 5 terms, ảnh phù hợp với nội dung
STUDYSET_DATA = [
    {
        "title": "Biology Basics",
        "description": "Fundamental biological concepts",
        "category_name": "Science",
        "terms": [
            ("Photosynthesis", "Process by which plants convert sunlight into chemical energy", "Plants use photosynthesis to convert CO2 and water into glucose, releasing oxygen. This is the primary energy source for most living organisms on Earth. The process occurs in chloroplasts and requires chlorophyll to capture light energy.", "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop"),
            ("Mitochondria", "Organelle that produces energy in the cell", "Mitochondria are called the 'powerhouse of the cell'. They convert glucose into ATP through cellular respiration, providing energy for all life activities. These organelles have their own DNA and can replicate independently within the cell.", "https://images.unsplash.com/photo-1532619675605-1ede6c7edfe0?w=400&h=400&fit=crop"),
            ("DNA", "Molecule that carries genetic information", "DNA contains genes that determine an organism's traits. The double helix structure of DNA allows it to replicate accurately and transmit genetic information from one generation to the next. DNA sequences code for proteins that perform various functions in living cells.", "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop"),
            ("Enzyme", "Protein that catalyzes chemical reactions in the body", "Enzymes speed up chemical reactions without being consumed. For example, the enzyme amylase in saliva helps break down starch into simpler sugars. Each enzyme is specific to its substrate and works best at optimal temperature and pH conditions.", "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop"),
            ("Cell Membrane", "Membrane surrounding the cell that controls substance transport", "The cell membrane is a selective protective layer that only allows certain substances to pass through. It maintains a stable internal environment and protects the cell from external agents. The membrane is composed of a phospholipid bilayer with embedded proteins.", "https://images.unsplash.com/photo-1532619675605-1ede6c7edfe0?w=400&h=400&fit=crop"),
        ]
    },
    {
        "title": "Chemistry Fundamentals",
        "description": "Fundamental principles of chemistry",
        "category_name": "Science",
        "terms": [
            ("Ionic Bond", "Chemical bond between oppositely charged ions", "When sodium (Na) loses an electron and chlorine (Cl) gains an electron, they form an ionic bond in the compound NaCl (table salt). This bond is very stable and creates a crystalline structure. Ionic compounds typically have high melting and boiling points.", "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=400&fit=crop"),
            ("Covalent Bond", "Chemical bond when atoms share electrons", "In a water molecule (H2O), the oxygen atom shares electrons with two hydrogen atoms, forming covalent bonds. This is the most common type of bond in organic compounds. Covalent bonds can be polar or nonpolar depending on electronegativity differences.", "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=400&fit=crop"),
            ("Catalyst", "Substance that increases the rate of a chemical reaction", "Catalysts lower the activation energy required for a reaction without being consumed. For example, enzymes in the body and catalytic converters in cars are both catalysts. They provide an alternative reaction pathway with lower energy requirements.", "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=400&fit=crop"),
            ("Oxidation", "Process of losing electrons by an atom or molecule", "When iron comes into contact with oxygen, it oxidizes to form rust (Fe2O3). Oxidation often releases energy and is an important part of cellular respiration. The opposite process is reduction, where electrons are gained.", "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=400&fit=crop"),
            ("pH Scale", "Scale measuring the acidity or basicity of a solution", "The pH scale ranges from 0-14, with 7 being neutral. Below 7 is acidic (like lemon juice with pH=2), above 7 is basic (like soap with pH=9). pH affects many biological and chemical processes, including enzyme activity and nutrient availability.", "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=400&fit=crop"),
        ]
    },
    {
        "title": "Physics Principles",
        "description": "Fundamental physics principles",
        "category_name": "Science",
        "terms": [
            ("Electromagnetic Wave", "Wave that transmits energy through electric and magnetic fields", "Light, radio waves, and X-rays are all electromagnetic waves. They transmit energy through space without requiring a medium, traveling at the speed of light (300,000 km/s). These waves have both electric and magnetic components that oscillate perpendicular to each other.", "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=400&fit=crop"),
            ("Thermodynamics", "Study of heat and energy", "The laws of thermodynamics describe how energy is converted. For example, a car engine converts heat from fuel combustion into mechanical energy to move the vehicle. The first law states energy is conserved; the second law states entropy always increases.", "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=400&fit=crop"),
            ("Quantum Mechanics", "Theory describing the behavior of matter at the atomic level", "Quantum mechanics explains phenomena like the photoelectric effect and lasers. It shows that particles can exist in multiple states simultaneously (superposition) and that observation affects the system. This theory is fundamental to understanding atomic and subatomic behavior.", "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=400&fit=crop"),
            ("Relativity", "Theory about space, time, and gravity", "Einstein's theory of relativity shows that time and space can be curved by mass. GPS systems must account for this effect to function accurately. The theory has two parts: special relativity (for objects in uniform motion) and general relativity (for accelerated motion and gravity).", "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=400&fit=crop"),
            ("Entropy", "Measure of disorder or randomness in a system", "Entropy always increases in closed systems. For example, a hot cup of coffee will cool down and the temperature will distribute evenly throughout the room, increasing the system's entropy. This is the second law of thermodynamics in action.", "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=400&fit=crop"),
        ]
    },
    {
        "title": "English Vocabulary",
        "description": "Advanced English vocabulary",
        "category_name": "Language",
        "terms": [
            ("Ephemeral", "Lasting for a very short time, transient", "Cherry blossoms are beautiful but ephemeral - they only last a few weeks each year. Many beautiful moments in life are also ephemeral, making them more precious. The word comes from Greek 'ephemeros' meaning 'lasting only a day'.", "https://images.unsplash.com/photo-1492571350019-22de08371fd3?w=400&h=400&fit=crop"),
            ("Ubiquitous", "Present everywhere, widespread", "Smartphones have become ubiquitous in modern society. The internet is also ubiquitous, allowing us to access information from anywhere in the world. This term describes something that seems to be everywhere at once.", "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&h=400&fit=crop"),
            ("Paradigm", "A model, pattern, or way of thinking", "The shift from fossil fuels to renewable energy represents a paradigm shift. The way we work has also changed paradigms with technological development. A paradigm is a framework of ideas and assumptions that shapes how we understand the world.", "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=400&fit=crop"),
            ("Serendipity", "The occurrence of pleasant discoveries by accident", "The discovery of penicillin is an example of serendipity - Alexander Fleming accidentally discovered mold that killed bacteria. Many important inventions have come from serendipity, where chance encounters lead to valuable findings.", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop"),
            ("Resilience", "The ability to recover and adapt after difficulties", "Resilience is the capacity to overcome challenges and become stronger. Forest trees demonstrate resilience when they regrow after fires, similar to how humans learn from failure. It's the mental toughness to bounce back from adversity.", "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop"),
        ]
    },
    {
        "title": "Spanish Advanced",
        "description": "Advanced Spanish vocabulary and grammar",
        "category_name": "Language",
        "terms": [
            ("Subjuntivo", "Subjunctive mood in Spanish, expressing uncertainty or subjectivity", "Subjuntivo is used to express desires, emotions, or possibilities. For example: 'Espero que vengas' (I hope you come) - 'vengas' is subjuntivo, not indicativo. It's triggered by expressions of doubt, emotion, or influence.", "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=400&fit=crop"),
            ("Pretérito Perfecto", "Present perfect tense, expressing completed actions", "Pretérito perfecto is used for actions in the recent past or those related to the present. For example: 'He comido' (I have eaten) - uses 'haber' + past participle. It's formed with the present tense of 'haber' plus the past participle.", "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=400&fit=crop"),
            ("Reflexivo", "Reflexive verb, where the action affects the subject itself", "Reflexive verbs end with 'se' in the infinitive form. Examples: 'levantarse' (to get up), 'ducharse' (to shower). 'Me levanto a las 7' (I get up at 7) - 'me' is the reflexive pronoun. These verbs indicate the subject performs and receives the action.", "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=400&fit=crop"),
            ("Gustar", "Special verb meaning 'to like', with inverted structure", "Gustar has a special structure: 'Me gusta el café' (I like coffee) - literally means 'Coffee pleases me'. The grammatical subject is 'el café', not 'yo'. It's conjugated based on what is liked, not who likes it.", "https://images.unsplash.com/photo-1511920170033-83939c283aa6?w=400&h=400&fit=crop"),
            ("Por vs Para", "Two prepositions with different uses", "'Por' is used for reason, approximate time, exchange. 'Para' is used for purpose, destination, deadline. 'Estudio por placer' (I study for pleasure) vs 'Estudio para ser médico' (I study to become a doctor). Understanding this distinction is crucial for Spanish fluency.", "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=400&fit=crop"),
        ]
    },
    {
        "title": "Python Advanced",
        "description": "Advanced Python programming concepts",
        "category_name": "Programming",
        "terms": [
            ("Decorator", "Function that wraps another function to extend behavior without modifying it", "Decorators allow adding functionality like logging, caching, or access control. For example: @property decorator converts a method into an attribute, allowing access like 'obj.name' instead of 'obj.name()'. Decorators use the @ syntax and are powerful tools for code reuse.", "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=400&fit=crop"),
            ("Generator", "Function that returns an iterator, creating values on demand rather than all at once", "Generators use 'yield' instead of 'return', allowing creation of large datasets without consuming memory. Example: 'def count(): yield from range(1000000)' generates numbers from 0 to 999999 without storing all in memory. They're memory-efficient for large sequences.", "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=400&fit=crop"),
            ("Context Manager", "Object that manages resources with 'with' statement", "Context managers ensure resources are properly released. 'with open('file.txt') as f:' automatically closes the file when exiting the block, even if an error occurs. This is crucial for preventing resource leaks and follows the RAII (Resource Acquisition Is Initialization) pattern.", "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=400&fit=crop"),
            ("Metaclass", "Class of a class, controlling how classes are created", "Metaclasses allow customizing how classes are created. For example, ORMs like SQLAlchemy use metaclasses to automatically generate database methods from class definitions. They operate at a higher level than decorators, controlling class creation itself.", "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=400&fit=crop"),
            ("Async/Await", "Asynchronous programming for efficient I/O operations", "Async/await allows waiting for I/O tasks (like reading files, calling APIs) without blocking the main thread. 'async def fetch(): await response.json()' enables handling multiple requests concurrently, improving web application performance. It's essential for scalable applications.", "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=400&fit=crop"),
        ]
    },
    {
        "title": "Data Structures",
        "description": "Data structures and algorithms",
        "category_name": "Programming",
        "terms": [
            ("Hash Table", "Data structure mapping key-value pairs with average O(1) access", "Hash tables use a hash function to convert keys into indices, enabling fast access. Dictionaries in Python and HashMaps in Java are hash tables. Average time complexity is O(1) for insert, delete, and lookup operations, making them highly efficient for large datasets.", "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=400&fit=crop"),
            ("Binary Search Tree", "Ordered binary tree enabling efficient searching", "BST has the property: left node < root < right node. This allows searching with O(log n) complexity when balanced. However, if the tree becomes unbalanced, complexity can degrade to O(n). Self-balancing trees like AVL or Red-Black trees maintain optimal performance.", "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=400&fit=crop"),
            ("Graph", "Data structure consisting of nodes and edges connecting them", "Graphs describe relationships between objects. Social networks are graphs: users are nodes, friend connections are edges. Algorithms like BFS (Breadth-First Search) and DFS (Depth-First Search) are used to find paths or explore graphs. They're fundamental in network analysis.", "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=400&fit=crop"),
            ("Dynamic Programming", "Problem-solving technique by breaking down and storing results", "Dynamic programming avoids recomputation by storing results of subproblems. For example, calculating Fibonacci numbers: instead of recalculating F(n-1) and F(n-2) each time, store computed values in an array for reuse. This trades space for time efficiency.", "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=400&fit=crop"),
            ("Big O Notation", "Notation describing time and space complexity of algorithms", "Big O describes how algorithms scale as input increases. O(1) is constant, O(n) is linear, O(n²) is quadratic. Example: searching an unsorted array is O(n), while searching a sorted array is O(log n) with binary search. It's essential for algorithm analysis.", "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=400&fit=crop"),
        ]
    },
    {
        "title": "Web Development",
        "description": "Modern web development concepts",
        "category_name": "Programming",
        "terms": [
            ("RESTful API", "API architecture following REST principles", "RESTful APIs use HTTP methods (GET, POST, PUT, DELETE) to manipulate resources. URLs represent resources: '/api/users/123' is the user with ID 123. Being stateless and cacheable makes APIs scalable and maintainable. REST stands for Representational State Transfer.", "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=400&fit=crop"),
            ("JWT Token", "JSON Web Token, stateless authentication method", "JWT contains encoded user information, allowing server authentication without storing sessions. Tokens consist of 3 parts: header, payload, signature. After login, clients store tokens and include them with each request for authentication. This enables distributed systems.", "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=400&fit=crop"),
            ("Single Page Application", "Web application that loads once and updates dynamically", "SPAs load initial HTML/CSS/JS, then update content using JavaScript without page reloads. React, Vue, and Angular all create SPAs. Advantages: smooth experience, reduced server load; disadvantages: more complex SEO, longer initial load time. They provide app-like experiences in browsers.", "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=400&fit=crop"),
            ("Microservices", "Architecture dividing applications into independent services", "Microservices break large applications into small services, each with its own database and communicating via APIs. Advantages: easy scaling, independent deployment, technology diversity. Disadvantages: more complexity, need to manage networks and data consistency. This contrasts with monolithic architectures.", "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=400&fit=crop"),
            ("CI/CD Pipeline", "Automated process for building, testing, and deploying", "CI (Continuous Integration) automatically tests new code. CD (Continuous Deployment) automatically deploys tested code. Pipelines run on new commits: build → test → deploy. This helps catch errors early, reduces release time, and ensures code quality. Tools include Jenkins, GitHub Actions, and GitLab CI.", "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=400&fit=crop"),
        ]
    },
]

# Class data - 3 classes: 1 private, 2 public
CLASS_DATA = [
    {
        "name": "Natural Sciences",
        "description": "Comprehensive study of sciences: Biology, Chemistry, Physics",
        "is_public": True,
        "studyset_indices": [0, 1, 2]  # Biology, Chemistry, Physics
    },
    {
        "name": "Language Studies",
        "description": "Advanced English and Spanish learning",
        "is_public": True,
        "studyset_indices": [3, 4]  # English, Spanish
    },
    {
        "name": "Advanced Programming",
        "description": "In-depth Python programming and web development course",
        "is_public": False,  # Private class
        "studyset_indices": [5, 6, 7]  # Python Advanced, Data Structures, Web Development
    },
]


def get_existing_teacher(session: Session) -> User | None:
    """Get existing teacher user from database"""
    statement = select(User).where(User.role == UserRole.TEACHER)
    teacher = session.exec(statement).first()
    
    if teacher:
        print(f"✓ Found existing teacher: {teacher.username} ({teacher.email})")
        return teacher
    
    print("✗ No teacher found in database")
    return None


def get_existing_student(session: Session) -> User | None:
    """Get existing student user from database"""
    statement = select(User).where(User.role == UserRole.STUDENT)
    student = session.exec(statement).first()
    
    if student:
        print(f"✓ Found existing student: {student.username} ({student.email})")
        return student
    
    print("✗ No student found in database")
    return None


def seed_categories(session: Session, teacher: User) -> dict[str, Category]:
    """Create categories and return mapping of category name to Category object"""
    categories = {}
    
    print("📁 Creating Categories...")
    
    for data in CATEGORY_DATA:
        # Check if category already exists
        existing = session.exec(
            select(Category).where(
                Category.name == data["name"],
                Category.owner_id == teacher.user_id
            )
        ).first()
        
        if existing:
            categories[data["name"]] = existing
            print(f"  ✓ Using existing: {data['name']}")
        else:
            category = Category(
                category_id=uuid.uuid4(),
                name=data["name"],
                description=data.get("description"),
                color=data.get("color"),
                owner_id=teacher.user_id,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            session.add(category)
            session.commit()
            session.refresh(category)
            categories[data["name"]] = category
            print(f"  ✓ Created: {data['name']}")
    
    return categories


def cleanup_old_seed_data(session: Session, teacher: User):
    """Delete all previously seeded test data"""
    print("\n🗑️  Cleaning up old seed data...")
    
    # Delete classes with TEST codes and their relationships
    test_classes = session.exec(
        select(Class).where(Class.class_code.startswith("TEST"))
    ).all()
    
    deleted_reattempts = 0
    deleted_attempts = 0
    deleted_class_studysets = 0
    deleted_class_members = 0
    
    for class_obj in test_classes:
        class_id = class_obj.class_id
        
        # 1. Delete ReattemptRequest entries first (has FK to both TestAttempt and Class)
        reattempts = session.exec(
            select(ReattemptRequest).where(ReattemptRequest.class_id == class_id)
        ).all()
        for reattempt in reattempts:
            session.delete(reattempt)
            deleted_reattempts += 1
        
        # 2. Delete TestAttempt entries (has FK to Class)
        attempts = session.exec(
            select(TestAttempt).where(TestAttempt.class_id == class_id)
        ).all()
        for attempt in attempts:
            session.delete(attempt)
            deleted_attempts += 1
        
        # 3. Delete ClassStudySet entries
        class_studysets = session.exec(
            select(ClassStudySet).where(ClassStudySet.class_id == class_id)
        ).all()
        for css in class_studysets:
            session.delete(css)
            deleted_class_studysets += 1
        
        # 4. Delete ClassMember entries
        class_members = session.exec(
            select(ClassMember).where(ClassMember.class_id == class_id)
        ).all()
        for cm in class_members:
            session.delete(cm)
            deleted_class_members += 1
        
        # 5. Delete the class
        session.delete(class_obj)
    
    session.commit()
    print(f"  ✓ Deleted {len(test_classes)} test classes")
    if deleted_reattempts > 0:
        print(f"  ✓ Deleted {deleted_reattempts} reattempt requests")
    if deleted_attempts > 0:
        print(f"  ✓ Deleted {deleted_attempts} test attempts")
    if deleted_class_studysets > 0:
        print(f"  ✓ Deleted {deleted_class_studysets} class-studyset links")
    if deleted_class_members > 0:
        print(f"  ✓ Deleted {deleted_class_members} class members")
    
    # Get all studysets owned by teacher
    teacher_studysets = session.exec(
        select(StudySet).where(StudySet.owner_id == teacher.user_id)
    ).all()
    
    # Delete related data and studysets
    deleted_terms = 0
    deleted_class_studysets = 0
    deleted_progress = 0
    deleted_activities = 0
    deleted_tests = 0
    deleted_ai_contents = 0
    deleted_attributes = 0
    deleted_conversations = 0
    
    for studyset in teacher_studysets:
        studyset_id = studyset.studyset_id
        
        # 1. Delete ChatConversation entries first (has NOT NULL FK to StudySet, cascade deletes ChatMessage)
        conversations = session.exec(
            select(ChatConversation).where(ChatConversation.studyset_id == studyset_id)
        ).all()
        for conversation in conversations:
            session.delete(conversation)
            deleted_conversations += 1
        
        # 2. Delete AIGeneratedContents entries (has NOT NULL FK to StudySet)
        ai_contents = session.exec(
            select(AIGeneratedContents).where(AIGeneratedContents.studyset_id == studyset_id)
        ).all()
        for ai_content in ai_contents:
            session.delete(ai_content)
            deleted_ai_contents += 1
        
        # 3. Delete Attribute entries (has NOT NULL FK to StudySet)
        attributes = session.exec(
            select(Attribute).where(Attribute.studyset_id == studyset_id)
        ).all()
        for attribute in attributes:
            session.delete(attribute)
            deleted_attributes += 1
        
        # 4. Delete ProgressSummary entries (has NOT NULL FK to StudySet)
        progress_summaries = session.exec(
            select(ProgressSummary).where(ProgressSummary.studyset_id == studyset_id)
        ).all()
        for progress in progress_summaries:
            session.delete(progress)
            deleted_progress += 1
        
        # 5. Delete StudyActivity entries (has NOT NULL FK to StudySet)
        activities = session.exec(
            select(StudyActivity).where(StudyActivity.studyset_id == studyset_id)
        ).all()
        for activity in activities:
            session.delete(activity)
            deleted_activities += 1
        
        # 6. Delete Test entries (has FK to StudySet, and TestAttempt/TestQuestion cascade)
        tests = session.exec(
            select(Test).where(Test.studyset_id == studyset_id)
        ).all()
        for test in tests:
            session.delete(test)
            deleted_tests += 1
        
        # 7. Delete ClassStudySet entries for this studyset
        class_studyset_entries = session.exec(
            select(ClassStudySet).where(ClassStudySet.studyset_id == studyset_id)
        ).all()
        for entry in class_studyset_entries:
            session.delete(entry)
            deleted_class_studysets += 1
        
        # 8. Delete all terms in this studyset (has FK to StudySet)
        terms = session.exec(
            select(Term).where(Term.studyset_id == studyset_id)
        ).all()
        for term in terms:
            session.delete(term)
            deleted_terms += 1
        
        # 9. Delete the studyset
        session.delete(studyset)
    
    session.commit()
    print(f"  ✓ Deleted {len(teacher_studysets)} studysets, {deleted_terms} terms, {deleted_class_studysets} class-studyset links")
    if deleted_conversations > 0:
        print(f"  ✓ Deleted {deleted_conversations} chat conversations")
    if deleted_ai_contents > 0:
        print(f"  ✓ Deleted {deleted_ai_contents} AI generated contents")
    if deleted_attributes > 0:
        print(f"  ✓ Deleted {deleted_attributes} attributes")
    if deleted_progress > 0:
        print(f"  ✓ Deleted {deleted_progress} progress summaries")
    if deleted_activities > 0:
        print(f"  ✓ Deleted {deleted_activities} study activities")
    if deleted_tests > 0:
        print(f"  ✓ Deleted {deleted_tests} tests")
    print()


def seed_studysets(session: Session, teacher: User, categories: dict[str, Category]) -> list[StudySet]:
    """Create studysets with terms"""
    studysets = []
    
    print("\n📚 Creating StudySets...")
    
    for idx, data in enumerate(STUDYSET_DATA):
        # Get category_id from category name
        category_name = data.get("category_name")
        category_id = None
        if category_name and category_name in categories:
            category_id = categories[category_name].category_id
        
        # Create studyset
        studyset = StudySet(
            studyset_id=uuid.uuid4(),
            title=data["title"],
            description=data["description"],
            category_id=category_id,
            owner_id=teacher.user_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        session.add(studyset)
        session.commit()
        session.refresh(studyset)
        
        # Create terms
        for term_data in data["terms"]:
            # Support both old format (3 items) and new format (4 items with image_url)
            if len(term_data) == 4:
                term_text, definition, example, image_url = term_data
            else:
                term_text, definition, example = term_data
                image_url = None
            
            term = Term(
                term_id=uuid.uuid4(),
                studyset_id=studyset.studyset_id,
                term_text=term_text,
                definition=definition,
                example=example,
                image_url=image_url,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            session.add(term)
        
        session.commit()
        studysets.append(studyset)
        
        print(f"  ✓ Created: {data['title']} ({len(data['terms'])} terms)")
    
    return studysets


def seed_classes(session: Session, teacher: User, student: User | None, studysets: list[StudySet]):
    """Create classes and add studysets"""
    print("\n🏫 Creating Classes...")
    
    for idx, data in enumerate(CLASS_DATA):
        # Generate class code
        class_code = f"TEST{idx+1:03d}"
        
        # Create class
        class_obj = Class(
            class_id=uuid.uuid4(),
            class_name=data["name"],
            description=data["description"],
            created_by=teacher.username,
            owner_user_id=teacher.user_id,
            is_public=data["is_public"],
            class_code=class_code,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        session.add(class_obj)
        session.commit()
        session.refresh(class_obj)
        
        # Add teacher as owner
        teacher_member = ClassMember(
            class_id=class_obj.class_id,
            user_id=teacher.user_id,
            role=ClassRole.OWNER,
            status=MembershipStatus.ACTIVE,
            joined_at=datetime.utcnow(),
            approved_at=datetime.utcnow()
        )
        session.add(teacher_member)
        
        # Add student as member (if exists)
        member_info = "1 member (teacher)"
        if student:
            student_member = ClassMember(
                class_id=class_obj.class_id,
                user_id=student.user_id,
                role=ClassRole.MEMBER,
                status=MembershipStatus.ACTIVE,
                invited_by=teacher.user_id,
                joined_at=datetime.utcnow(),
                approved_at=datetime.utcnow()
            )
            session.add(student_member)
            member_info = "2 members (teacher + student)"
        
        session.commit()
        
        # Add studysets to class
        studyset_count = 0
        for ss_idx in data["studyset_indices"]:
            if ss_idx < len(studysets):
                class_studyset = ClassStudySet(
                    class_id=class_obj.class_id,
                    studyset_id=studysets[ss_idx].studyset_id,
                    added_by=teacher.user_id,
                    added_at=datetime.utcnow()
                )
                session.add(class_studyset)
                studyset_count += 1
        
        session.commit()
        
        print(f"  ✓ Created: {data['name']} ({studyset_count} studysets, {member_info}, code: {class_code})")


def main():
    """Main seeding function"""
    print("=" * 60)
    print("🌱 SEEDING TEST DATA")
    print("=" * 60)
    
    with Session(engine) as session:
        # Get existing users
        print("\n👥 Finding Existing Users...")
        teacher = get_existing_teacher(session)
        student = get_existing_student(session)
        
        if not teacher:
            print("\n❌ ERROR: No teacher user found in database!")
            print("Please create a teacher user first or login with a teacher account.")
            return
        
        if not student:
            print("\n⚠️  WARNING: No student user found.")
            print("Classes will be created without student members.")
            print("You can add students to classes later.\n")
        
        # Clean up old seed data
        cleanup_old_seed_data(session, teacher)
        
        # Create categories
        categories = seed_categories(session, teacher)
        
        # Create studysets
        studysets = seed_studysets(session, teacher, categories)
        
        # Create classes
        seed_classes(session, teacher, student, studysets)
    
    print("\n" + "=" * 60)
    print("✅ SEEDING COMPLETE!")
    print("=" * 60)
    print("\n📊 Data Summary:")
    print(f"  Categories: {len(CATEGORY_DATA)}")
    print(f"  StudySets: {len(STUDYSET_DATA)}")
    print(f"  Classes: {len(CLASS_DATA)}")
    print(f"  Terms per StudySet: 5")
    print("\n🔗 Class Codes:")
    for idx in range(len(CLASS_DATA)):
        class_type = "Public" if CLASS_DATA[idx]["is_public"] else "Private"
        print(f"  Class {idx+1} ({class_type}): TEST{idx+1:03d}")
    print()


if __name__ == "__main__":
    main()
