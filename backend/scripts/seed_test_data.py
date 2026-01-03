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
from app.models import User, StudySet, Term, Class, ClassMember, ClassStudySet, UserRole, ClassRole, MembershipStatus
from app.core.security import get_password_hash
import uuid
from datetime import datetime

# Test data: Topics and their terms
STUDYSET_DATA = [
    {
        "title": "Spanish Basics",
        "description": "Essential Spanish vocabulary for beginners",
        "terms": [
            ("Hola", "Hello", "¡Hola! ¿Cómo estás?"),
            ("Gracias", "Thank you", "Gracias por tu ayuda"),
            ("Por favor", "Please", "Un café, por favor"),
            ("Buenos días", "Good morning", "Buenos días, señor"),
            ("Buenas noches", "Good night", "Buenas noches, que descanses"),
            ("Adiós", "Goodbye", "Adiós, hasta luego"),
            ("Sí", "Yes", "Sí, estoy de acuerdo"),
            ("No", "No", "No, gracias"),
            ("¿Cómo te llamas?", "What's your name?", "¿Cómo te llamas? Me llamo María"),
            ("Mucho gusto", "Nice to meet you", "Mucho gusto en conocerte"),
        ]
    },
    {
        "title": "French Essentials",
        "description": "Common French phrases",
        "terms": [
            ("Bonjour", "Hello/Good day", "Bonjour, comment allez-vous?"),
            ("Merci", "Thank you", "Merci beaucoup"),
            ("S'il vous plaît", "Please", "Un café, s'il vous plaît"),
            ("Au revoir", "Goodbye", "Au revoir, à bientôt"),
            ("Oui", "Yes", "Oui, c'est correct"),
            ("Non", "No", "Non, merci"),
            ("Excusez-moi", "Excuse me", "Excusez-moi, où sont les toilettes?"),
            ("Pardon", "Sorry", "Pardon, je ne comprends pas"),
            ("Bonne nuit", "Good night", "Bonne nuit, dormez bien"),
            ("Comment ça va?", "How are you?", "Comment ça va? Ça va bien"),
        ]
    },
    {
        "title": "German Vocabulary",
        "description": "Basic German words",
        "terms": [
            ("Guten Tag", "Good day", "Guten Tag! Wie geht es Ihnen?"),
            ("Danke", "Thank you", "Danke schön"),
            ("Bitte", "Please/You're welcome", "Bitte sehr"),
            ("Auf Wiedersehen", "Goodbye", "Auf Wiedersehen, bis bald"),
            ("Ja", "Yes", "Ja, das stimmt"),
            ("Nein", "No", "Nein, danke"),
            ("Entschuldigung", "Excuse me/Sorry", "Entschuldigung, ich verstehe nicht"),
            ("Guten Morgen", "Good morning", "Guten Morgen! Hast du gut geschlafen?"),
            ("Gute Nacht", "Good night", "Gute Nacht, schlaf gut"),
            ("Wie heißt du?", "What's your name?", "Wie heißt du? Ich heiße Hans"),
        ]
    },
    {
        "title": "Japanese Basics",
        "description": "Essential Japanese phrases",
        "terms": [
            ("こんにちは (Konnichiwa)", "Hello", "こんにちは！元気ですか？"),
            ("ありがとう (Arigatou)", "Thank you", "ありがとうございます"),
            ("すみません (Sumimasen)", "Excuse me/Sorry", "すみません、わかりません"),
            ("さようなら (Sayounara)", "Goodbye", "さようなら、また明日"),
            ("はい (Hai)", "Yes", "はい、そうです"),
            ("いいえ (Iie)", "No", "いいえ、違います"),
            ("おはよう (Ohayou)", "Good morning", "おはようございます"),
            ("おやすみ (Oyasumi)", "Good night", "おやすみなさい"),
            ("お願いします (Onegaishimasu)", "Please", "コーヒーをお願いします"),
            ("どういたしまして (Douitashimashite)", "You're welcome", "どういたしまして"),
        ]
    },
    {
        "title": "Python Programming",
        "description": "Core Python concepts",
        "terms": [
            ("Variable", "A named storage location", "x = 10"),
            ("Function", "Reusable block of code", "def greet(): print('Hello')"),
            ("List", "Ordered collection of items", "fruits = ['apple', 'banana']"),
            ("Dictionary", "Key-value pairs", "person = {'name': 'John', 'age': 30}"),
            ("Loop", "Repeat code multiple times", "for i in range(5): print(i)"),
            ("Class", "Blueprint for objects", "class Dog: pass"),
            ("Import", "Include external modules", "import math"),
            ("Exception", "Handle errors", "try: x = 1/0 except: print('Error')"),
            ("String", "Text data type", "name = 'Alice'"),
            ("Boolean", "True or False value", "is_valid = True"),
        ]
    },
    {
        "title": "JavaScript Fundamentals",
        "description": "Essential JavaScript concepts",
        "terms": [
            ("const", "Immutable variable", "const PI = 3.14"),
            ("let", "Mutable variable", "let count = 0"),
            ("function", "Code block", "function add(a, b) { return a + b }"),
            ("arrow function", "Concise function syntax", "const add = (a, b) => a + b"),
            ("array", "Ordered list", "const nums = [1, 2, 3]"),
            ("object", "Key-value pairs", "const user = { name: 'John' }"),
            ("Promise", "Async operation", "fetch(url).then(res => res.json())"),
            ("async/await", "Handle promises", "const data = await fetch(url)"),
            ("map", "Transform array", "[1,2,3].map(x => x * 2)"),
            ("filter", "Filter array", "[1,2,3].filter(x => x > 1)"),
        ]
    },
    {
        "title": "Biology Terms",
        "description": "Basic biology vocabulary",
        "terms": [
            ("Cell", "Basic unit of life", "All living things are made of cells"),
            ("DNA", "Genetic material", "DNA contains the instructions for life"),
            ("Photosynthesis", "Plant food production", "Plants use sunlight to make food"),
            ("Mitosis", "Cell division", "One cell divides into two identical cells"),
            ("Enzyme", "Biological catalyst", "Enzymes speed up chemical reactions"),
            ("Gene", "Unit of heredity", "Genes determine traits"),
            ("Protein", "Large molecule", "Proteins are made of amino acids"),
            ("Chromosome", "DNA structure", "Humans have 46 chromosomes"),
            ("Nucleus", "Cell control center", "The nucleus contains DNA"),
            ("Membrane", "Cell boundary", "The cell membrane controls what enters"),
        ]
    },
    {
        "title": "Chemistry Basics",
        "description": "Fundamental chemistry terms",
        "terms": [
            ("Atom", "Smallest unit of element", "Atoms make up everything"),
            ("Molecule", "Two or more atoms bonded", "H2O is a water molecule"),
            ("Element", "Pure substance", "Gold is an element"),
            ("Compound", "Two or more elements", "Salt (NaCl) is a compound"),
            ("Ion", "Charged particle", "Na+ is a sodium ion"),
            ("Acid", "pH less than 7", "Vinegar is an acid"),
            ("Base", "pH greater than 7", "Soap is a base"),
            ("Reaction", "Chemical change", "Rust is a chemical reaction"),
            ("Solution", "Mixture", "Salt water is a solution"),
            ("Catalyst", "Speed up reaction", "Enzymes are biological catalysts"),
        ]
    },
    {
        "title": "Physics Concepts",
        "description": "Basic physics terms",
        "terms": [
            ("Force", "Push or pull", "F = ma (Newton's law)"),
            ("Energy", "Ability to do work", "Energy cannot be created or destroyed"),
            ("Motion", "Change in position", "Velocity is speed with direction"),
            ("Gravity", "Attractive force", "Earth's gravity pulls objects down"),
            ("Momentum", "Mass times velocity", "p = mv"),
            ("Work", "Force times distance", "W = F × d"),
            ("Power", "Work per time", "P = W / t"),
            ("Wave", "Energy transfer", "Light and sound are waves"),
            ("Friction", "Resistance to motion", "Friction slows things down"),
            ("Acceleration", "Change in velocity", "a = Δv / Δt"),
        ]
    },
    {
        "title": "History - World War II",
        "description": "Key WW2 terms and events",
        "terms": [
            ("D-Day", "Allied invasion of Normandy", "June 6, 1944"),
            ("Pearl Harbor", "Japanese attack on US", "December 7, 1941"),
            ("Holocaust", "Genocide of Jews", "6 million Jews killed"),
            ("Atomic Bomb", "Nuclear weapon", "Dropped on Hiroshima and Nagasaki"),
            ("Allies", "Allied powers", "US, UK, Soviet Union, France"),
            ("Axis", "Axis powers", "Germany, Italy, Japan"),
            ("Blitzkrieg", "Lightning war", "Fast military attack"),
            ("V-E Day", "Victory in Europe", "May 8, 1945"),
            ("V-J Day", "Victory over Japan", "August 15, 1945"),
            ("Cold War", "Post-WW2 tension", "US vs Soviet Union"),
        ]
    },
    {
        "title": "Geography - Countries",
        "description": "World countries and capitals",
        "terms": [
            ("France", "Capital: Paris", "Located in Western Europe"),
            ("Japan", "Capital: Tokyo", "Island nation in East Asia"),
            ("Brazil", "Capital: Brasília", "Largest country in South America"),
            ("Egypt", "Capital: Cairo", "Home of the pyramids"),
            ("Australia", "Capital: Canberra", "Continent and country"),
            ("Canada", "Capital: Ottawa", "Second largest country by area"),
            ("India", "Capital: New Delhi", "Most populous democracy"),
            ("Germany", "Capital: Berlin", "Largest economy in Europe"),
            ("Mexico", "Capital: Mexico City", "South of the United States"),
            ("China", "Capital: Beijing", "Most populous country"),
        ]
    },
    {
        "title": "Mathematics - Algebra",
        "description": "Basic algebra terms",
        "terms": [
            ("Variable", "Unknown value", "x, y, z are common variables"),
            ("Equation", "Mathematical statement", "2x + 3 = 7"),
            ("Expression", "Math phrase", "3x + 2y"),
            ("Coefficient", "Number before variable", "In 3x, 3 is the coefficient"),
            ("Constant", "Fixed value", "In x + 5, 5 is constant"),
            ("Polynomial", "Sum of terms", "x² + 3x + 2"),
            ("Quadratic", "Degree 2 polynomial", "ax² + bx + c"),
            ("Factor", "Break down expression", "x² - 4 = (x+2)(x-2)"),
            ("Solve", "Find variable value", "Solve for x: 2x = 10"),
            ("Simplify", "Reduce to simplest form", "2x + 3x = 5x"),
        ]
    },
    {
        "title": "English Grammar",
        "description": "Parts of speech",
        "terms": [
            ("Noun", "Person, place, thing", "Dog, city, happiness"),
            ("Verb", "Action or state", "Run, think, is"),
            ("Adjective", "Describes noun", "Beautiful, tall, red"),
            ("Adverb", "Describes verb", "Quickly, very, happily"),
            ("Pronoun", "Replaces noun", "He, she, it, they"),
            ("Preposition", "Shows relationship", "In, on, at, under"),
            ("Conjunction", "Connects words", "And, but, or"),
            ("Interjection", "Exclamation", "Wow! Oh! Ouch!"),
            ("Article", "The, a, an", "The book, a cat, an apple"),
            ("Subject", "Who/what does action", "The dog barked"),
        ]
    },
    {
        "title": "Music Theory",
        "description": "Basic music concepts",
        "terms": [
            ("Note", "Musical sound", "A, B, C, D, E, F, G"),
            ("Scale", "Series of notes", "C major: C D E F G A B C"),
            ("Chord", "Three or more notes", "C major: C E G"),
            ("Tempo", "Speed of music", "Fast or slow"),
            ("Rhythm", "Pattern of beats", "Time signature"),
            ("Melody", "Main tune", "Sequence of notes"),
            ("Harmony", "Notes together", "Multiple notes at once"),
            ("Sharp", "Half step higher", "C# is C sharp"),
            ("Flat", "Half step lower", "Bb is B flat"),
            ("Octave", "8 notes apart", "C to C is an octave"),
        ]
    },
    {
        "title": "Art History",
        "description": "Art movements and terms",
        "terms": [
            ("Renaissance", "Cultural rebirth 14-17th century", "Da Vinci, Michelangelo"),
            ("Baroque", "Dramatic art 17th century", "Rembrandt, Caravaggio"),
            ("Impressionism", "Light and color focus", "Monet, Renoir"),
            ("Cubism", "Abstract geometric forms", "Picasso, Braque"),
            ("Surrealism", "Dream-like imagery", "Dalí, Magritte"),
            ("Abstract", "Non-representational", "Kandinsky, Pollock"),
            ("Pop Art", "Popular culture art", "Warhol, Lichtenstein"),
            ("Perspective", "Depth illusion", "One-point, two-point"),
            ("Composition", "Arrangement of elements", "Balance and harmony"),
            ("Medium", "Art material", "Oil, watercolor, acrylic"),
        ]
    },
    {
        "title": "Economics Basics",
        "description": "Fundamental economic terms",
        "terms": [
            ("Supply", "Amount available", "Quantity sellers offer"),
            ("Demand", "Amount desired", "Quantity buyers want"),
            ("Market", "Buyers and sellers", "Where exchange happens"),
            ("Price", "Cost of good", "Determined by supply/demand"),
            ("Inflation", "Rising prices", "Decrease in purchasing power"),
            ("GDP", "Gross Domestic Product", "Total economic output"),
            ("Recession", "Economic decline", "Negative GDP growth"),
            ("Interest Rate", "Cost of borrowing", "Bank lending rate"),
            ("Investment", "Money for future gain", "Stocks, bonds, property"),
            ("Profit", "Revenue minus costs", "Business earnings"),
        ]
    },
    {
        "title": "Psychology Terms",
        "description": "Basic psychology concepts",
        "terms": [
            ("Behavior", "Observable actions", "What we do"),
            ("Cognition", "Mental processes", "Thinking and knowing"),
            ("Memory", "Information storage", "Short-term and long-term"),
            ("Perception", "Interpreting senses", "How we see the world"),
            ("Emotion", "Feelings", "Joy, fear, anger"),
            ("Motivation", "Drive to act", "Why we do things"),
            ("Personality", "Individual traits", "Unique characteristics"),
            ("Learning", "Behavior change", "Experience-based"),
            ("Stress", "Mental pressure", "Response to demands"),
            ("Therapy", "Treatment method", "Counseling and support"),
        ]
    },
    {
        "title": "Computer Science",
        "description": "CS fundamentals",
        "terms": [
            ("Algorithm", "Step-by-step procedure", "Recipe for solving problems"),
            ("Data Structure", "Organized data", "Array, list, tree, graph"),
            ("Binary", "Base-2 system", "0s and 1s"),
            ("Recursion", "Function calls itself", "Solve by breaking down"),
            ("Loop", "Repeated execution", "For, while loops"),
            ("Variable", "Named storage", "Hold values"),
            ("Array", "Indexed collection", "List of elements"),
            ("String", "Text data", "Sequence of characters"),
            ("Integer", "Whole number", "No decimal points"),
            ("Boolean", "True/False", "Logical value"),
        ]
    },
    {
        "title": "Medical Terminology",
        "description": "Common medical terms",
        "terms": [
            ("Diagnosis", "Disease identification", "Doctor's conclusion"),
            ("Symptom", "Disease sign", "What patient feels"),
            ("Treatment", "Medical care", "How to cure"),
            ("Prescription", "Medicine order", "Doctor's instructions"),
            ("Chronic", "Long-term condition", "Ongoing illness"),
            ("Acute", "Sudden onset", "Short-term condition"),
            ("Infection", "Pathogen invasion", "Bacterial or viral"),
            ("Inflammation", "Body's response", "Swelling and redness"),
            ("Antibody", "Immune protein", "Fights disease"),
            ("Vaccine", "Disease prevention", "Immunity training"),
        ]
    },
    {
        "title": "Business Terms",
        "description": "Essential business vocabulary",
        "terms": [
            ("Revenue", "Total income", "Money from sales"),
            ("Expense", "Business costs", "Money spent"),
            ("Asset", "Owned resource", "Property, equipment"),
            ("Liability", "Debt or obligation", "What company owes"),
            ("Equity", "Owner's stake", "Assets minus liabilities"),
            ("ROI", "Return on Investment", "Profit from investment"),
            ("Marketing", "Promote products", "Advertising and sales"),
            ("Strategy", "Business plan", "Long-term approach"),
            ("Stakeholder", "Interested party", "Investors, employees"),
            ("Budget", "Financial plan", "Spending allocation"),
        ]
    },
]

# Class data
CLASS_DATA = [
    {
        "name": "Spanish Language Course 2024",
        "description": "Learn Spanish from scratch to intermediate level",
        "is_public": True,
        "studyset_indices": [0]  # Spanish Basics
    },
    {
        "name": "European Languages",
        "description": "Introduction to French and German",
        "is_public": True,
        "studyset_indices": [1, 2]  # French, German
    },
    {
        "name": "Programming Fundamentals",
        "description": "Learn Python and JavaScript programming",
        "is_public": True,
        "studyset_indices": [4, 5]  # Python, JavaScript
    },
    {
        "name": "Science 101",
        "description": "Basic concepts in Biology, Chemistry, and Physics",
        "is_public": True,
        "studyset_indices": [6, 7, 8]  # Biology, Chemistry, Physics
    },
    {
        "name": "High School Study Group",
        "description": "Math, English, and History for high school students",
        "is_public": False,
        "studyset_indices": [11, 12, 9]  # Algebra, Grammar, WW2
    },
    {
        "name": "STEM Advanced Topics",
        "description": "Advanced Computer Science and Mathematics",
        "is_public": True,
        "studyset_indices": [17, 11, 4]  # CS, Algebra, Python
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


def cleanup_old_seed_data(session: Session, teacher: User):
    """Delete all previously seeded test data"""
    print("\n🗑️  Cleaning up old seed data...")
    
    # Delete classes with TEST codes and their relationships
    test_classes = session.exec(
        select(Class).where(Class.class_code.startswith("TEST"))
    ).all()
    
    for class_obj in test_classes:
        # Delete ClassStudySet entries
        session.exec(
            delete(ClassStudySet).where(ClassStudySet.class_id == class_obj.class_id)
        )
        # Delete ClassMember entries
        session.exec(
            delete(ClassMember).where(ClassMember.class_id == class_obj.class_id)
        )
        # Delete the class
        session.delete(class_obj)
    
    session.commit()
    print(f"  ✓ Deleted {len(test_classes)} test classes")
    
    # Get all studysets owned by teacher
    teacher_studysets = session.exec(
        select(StudySet).where(StudySet.owner_id == teacher.user_id)
    ).all()
    
    # Delete related data and studysets
    deleted_terms = 0
    deleted_class_studysets = 0
    for studyset in teacher_studysets:
        # Delete ClassStudySet entries for this studyset
        class_studyset_entries = session.exec(
            select(ClassStudySet).where(ClassStudySet.studyset_id == studyset.studyset_id)
        ).all()
        for entry in class_studyset_entries:
            session.delete(entry)
            deleted_class_studysets += 1
        
        # Delete all terms in this studyset
        terms = session.exec(
            select(Term).where(Term.studyset_id == studyset.studyset_id)
        ).all()
        for term in terms:
            session.delete(term)
            deleted_terms += 1
        
        # Delete the studyset
        session.delete(studyset)
    
    session.commit()
    print(f"  ✓ Deleted {len(teacher_studysets)} studysets, {deleted_terms} terms, {deleted_class_studysets} class-studyset links")
    print()


def seed_studysets(session: Session, teacher: User) -> list[StudySet]:
    """Create studysets with terms"""
    studysets = []
    
    print("📚 Creating StudySets...")
    
    for idx, data in enumerate(STUDYSET_DATA):
        # Create studyset
        studyset = StudySet(
            studyset_id=uuid.uuid4(),
            title=data["title"],
            description=data["description"],
            owner_id=teacher.user_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        session.add(studyset)
        session.commit()
        session.refresh(studyset)
        
        # Create terms
        for term_text, definition, example in data["terms"]:
            term = Term(
                term_id=uuid.uuid4(),
                studyset_id=studyset.studyset_id,
                term_text=term_text,
                definition=definition,
                example=example,
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
        
        # Create studysets
        studysets = seed_studysets(session, teacher)
        
        # Create classes
        seed_classes(session, teacher, student, studysets)
    
    print("\n" + "=" * 60)
    print("✅ SEEDING COMPLETE!")
    print("=" * 60)
    print("\n📊 Data Summary:")
    print(f"  StudySets: {len(STUDYSET_DATA)}")
    print(f"  Classes: {len(CLASS_DATA)}")
    print(f"  Terms per StudySet: ~10")
    print("\n🔗 Class Codes:")
    for idx in range(len(CLASS_DATA)):
        print(f"  Class {idx+1}: TEST{idx+1:03d}")
    print()


if __name__ == "__main__":
    main()
