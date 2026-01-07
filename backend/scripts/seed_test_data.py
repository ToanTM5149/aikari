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
    ChatConversation
)
from app.core.security import get_password_hash
import uuid
from datetime import datetime

# Test data: Topics and their terms
# Format: (term_text, definition, example, image_url)
# 10 Study Sets với chủ đề thực tế, ảnh và ví dụ phù hợp
STUDYSET_DATA = [
    {
        "title": "Spanish Basics",
        "description": "Essential Spanish vocabulary for beginners with real-world examples",
        "category": "Language",
        "terms": [
            ("Hola", "Hello", "¡Hola! ¿Cómo estás? (Hello! How are you?)", "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&h=400&fit=crop"),
            ("Gracias", "Thank you", "Gracias por tu ayuda. (Thank you for your help.)", "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=400&fit=crop"),
            ("Por favor", "Please", "Un café, por favor. (A coffee, please.)", "https://images.unsplash.com/photo-1511920170033-83939c283aa6?w=400&h=400&fit=crop"),
            ("Buenos días", "Good morning", "Buenos días, señor. (Good morning, sir.)", "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=400&h=400&fit=crop"),
            ("Buenas noches", "Good night", "Buenas noches, que descanses. (Good night, rest well.)", "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=400&h=400&fit=crop"),
            ("Adiós", "Goodbye", "Adiós, hasta luego. (Goodbye, see you later.)", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop"),
            ("Sí", "Yes", "Sí, estoy de acuerdo. (Yes, I agree.)", "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400&h=400&fit=crop"),
            ("No", "No", "No, gracias. (No, thank you.)", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop"),
            ("¿Cómo te llamas?", "What's your name?", "¿Cómo te llamas? Me llamo María. (What's your name? My name is María.)", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop"),
            ("Mucho gusto", "Nice to meet you", "Mucho gusto en conocerte. (Nice to meet you.)", "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&h=400&fit=crop"),
        ]
    },
    {
        "title": "Python Programming",
        "description": "Core Python concepts with practical examples",
        "category": "Programming",
        "terms": [
            ("Variable", "A named storage location for data", "x = 10  # x stores the value 10", "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=400&fit=crop"),
            ("Function", "Reusable block of code that performs a task", "def greet(name): return f'Hello, {name}!'", "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=400&fit=crop"),
            ("List", "Ordered collection of items", "fruits = ['apple', 'banana', 'orange']  # List of fruits", "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=400&fit=crop"),
            ("Dictionary", "Key-value pairs for storing data", "person = {'name': 'John', 'age': 30}  # Dictionary with name and age", "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=400&fit=crop"),
            ("Loop", "Repeats code multiple times", "for i in range(5): print(i)  # Prints 0, 1, 2, 3, 4", "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=400&fit=crop"),
            ("Class", "Blueprint for creating objects", "class Dog: def bark(self): return 'Woof!'  # Dog class with bark method", "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=400&fit=crop"),
            ("Import", "Includes external modules", "import math  # Now you can use math.sqrt(16) to get 4.0", "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=400&fit=crop"),
            ("Exception", "Handles errors in code", "try: result = 10/0 except ZeroDivisionError: print('Cannot divide by zero')", "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=400&fit=crop"),
            ("String", "Text data type", "name = 'Alice'  # String variable containing text", "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=400&fit=crop"),
            ("Boolean", "True or False value", "is_valid = True  # Boolean variable for validation", "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=400&fit=crop"),
        ]
    },
    {
        "title": "Biology Terms",
        "description": "Essential biology vocabulary with real-world examples",
        "category": "Science",
        "terms": [
            ("Cell", "Basic unit of life", "All living things are made of cells. For example, your body contains trillions of cells.", "https://images.unsplash.com/photo-1532619675605-1ede6c7edfe0?w=400&h=400&fit=crop"),
            ("DNA", "Genetic material that carries hereditary information", "DNA contains the instructions for life. Your DNA determines your eye color and height.", "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop"),
            ("Photosynthesis", "Process by which plants make food using sunlight", "Plants use photosynthesis to convert sunlight, water, and CO2 into glucose. This is why plants need sunlight to grow.", "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop"),
            ("Mitosis", "Cell division that produces identical cells", "During mitosis, one cell divides into two identical cells. This is how your body grows and repairs itself.", "https://images.unsplash.com/photo-1532619675605-1ede6c7edfe0?w=400&h=400&fit=crop"),
            ("Enzyme", "Protein that speeds up chemical reactions", "Enzymes speed up chemical reactions in your body. For example, digestive enzymes break down food in your stomach.", "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop"),
            ("Gene", "Unit of heredity that determines traits", "Genes determine traits like hair color. You inherit genes from your parents.", "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop"),
            ("Protein", "Large molecule made of amino acids", "Proteins are essential for your body. For example, muscle tissue is made of proteins.", "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop"),
            ("Chromosome", "Structure that contains DNA", "Humans have 46 chromosomes. Chromosomes carry your genetic information.", "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop"),
            ("Nucleus", "Control center of the cell", "The nucleus contains DNA and controls cell activities. It's like the brain of the cell.", "https://images.unsplash.com/photo-1532619675605-1ede6c7edfe0?w=400&h=400&fit=crop"),
            ("Membrane", "Boundary that surrounds the cell", "The cell membrane controls what enters and leaves the cell. It protects the cell like a wall.", "https://images.unsplash.com/photo-1532619675605-1ede6c7edfe0?w=400&h=400&fit=crop"),
        ]
    },
    {
        "title": "Chemistry Basics",
        "description": "Fundamental chemistry terms with practical examples",
        "category": "Science",
        "terms": [
            ("Atom", "Smallest unit of an element", "Atoms make up everything. For example, a gold ring is made of gold atoms.", "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=400&fit=crop"),
            ("Molecule", "Two or more atoms bonded together", "H2O is a water molecule made of 2 hydrogen atoms and 1 oxygen atom.", "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=400&fit=crop"),
            ("Element", "Pure substance made of one type of atom", "Gold is an element. Oxygen and carbon are also elements found on the periodic table.", "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=400&fit=crop"),
            ("Compound", "Substance made of two or more different elements", "Salt (NaCl) is a compound made of sodium and chlorine. Water (H2O) is also a compound.", "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=400&fit=crop"),
            ("Ion", "Atom or molecule with an electric charge", "Na+ is a sodium ion with a positive charge. Ions are important in batteries and nerve signals.", "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=400&fit=crop"),
            ("Acid", "Substance with pH less than 7", "Vinegar is an acid with pH around 3. Lemon juice and stomach acid are also acids.", "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=400&fit=crop"),
            ("Base", "Substance with pH greater than 7", "Soap is a base with pH around 9-10. Baking soda is also a base used in cooking.", "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=400&fit=crop"),
            ("Reaction", "Process where substances change into new substances", "Rust is a chemical reaction where iron reacts with oxygen. Burning wood is also a chemical reaction.", "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=400&fit=crop"),
            ("Solution", "Homogeneous mixture of substances", "Salt water is a solution where salt dissolves in water. Sweet tea is also a solution.", "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=400&fit=crop"),
            ("Catalyst", "Substance that speeds up a chemical reaction", "Enzymes are biological catalysts. Catalytic converters in cars use catalysts to reduce pollution.", "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=400&fit=crop"),
        ]
    },
    {
        "title": "Physics Concepts",
        "description": "Basic physics terms with real-world applications",
        "category": "Science",
        "terms": [
            ("Force", "Push or pull that causes motion", "F = ma (Newton's law). For example, pushing a shopping cart requires force to move it.", "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=400&fit=crop"),
            ("Energy", "Ability to do work or cause change", "Energy cannot be created or destroyed, only transformed. Food gives your body energy to move.", "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=400&fit=crop"),
            ("Motion", "Change in position over time", "Velocity is speed with direction. A car moving at 60 mph north has both speed and direction.", "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=400&fit=crop"),
            ("Gravity", "Force that attracts objects toward each other", "Earth's gravity pulls objects down. This is why apples fall from trees and why you stay on the ground.", "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=400&fit=crop"),
            ("Momentum", "Mass times velocity (p = mv)", "A moving truck has more momentum than a moving bicycle because it has more mass. Momentum explains why it's hard to stop a fast-moving object.", "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=400&fit=crop"),
            ("Work", "Force applied over a distance (W = F × d)", "Lifting a box requires work. The more force or distance, the more work is done.", "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=400&fit=crop"),
            ("Power", "Rate of doing work (P = W / t)", "Power is work per time. A powerful engine can do work faster than a weak engine.", "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=400&fit=crop"),
            ("Wave", "Disturbance that transfers energy", "Light and sound are waves. Ocean waves carry energy from wind to the shore.", "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=400&fit=crop"),
            ("Friction", "Force that resists motion between surfaces", "Friction slows things down. Without friction, you couldn't walk because your feet would slip.", "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=400&fit=crop"),
            ("Acceleration", "Rate of change in velocity (a = Δv / Δt)", "When a car speeds up, it accelerates. Acceleration is how quickly velocity changes.", "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=400&fit=crop"),
        ]
    },
    {
        "title": "History - World War II",
        "description": "Key WW2 terms and events with historical context",
        "category": "History",
        "terms": [
            ("D-Day", "Allied invasion of Normandy, France", "On June 6, 1944, Allied forces launched the largest seaborne invasion in history, beginning the liberation of Western Europe from Nazi control.", "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop"),
            ("Pearl Harbor", "Japanese surprise attack on US naval base", "On December 7, 1941, Japan attacked Pearl Harbor in Hawaii, bringing the United States into World War II.", "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop"),
            ("Holocaust", "Systematic genocide of six million Jews by Nazi Germany", "The Holocaust was the systematic murder of 6 million Jews and millions of others during WWII. It remains one of history's greatest tragedies.", "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop"),
            ("Atomic Bomb", "Nuclear weapon used to end the war", "The US dropped atomic bombs on Hiroshima and Nagasaki in August 1945, leading to Japan's surrender and ending WWII.", "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop"),
            ("Allies", "Countries that fought against the Axis powers", "The Allies included the US, UK, Soviet Union, and France. They worked together to defeat Nazi Germany and Japan.", "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop"),
            ("Axis", "Alliance of Germany, Italy, and Japan", "The Axis powers were Germany, Italy, and Japan. They fought against the Allies during World War II.", "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop"),
            ("Blitzkrieg", "Lightning-fast military attack strategy", "Blitzkrieg was Germany's fast military attack strategy using tanks and aircraft. It means 'lightning war' in German.", "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop"),
            ("V-E Day", "Victory in Europe Day", "V-E Day on May 8, 1945 marked the end of WWII in Europe when Germany surrendered to the Allies.", "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop"),
            ("V-J Day", "Victory over Japan Day", "V-J Day on August 15, 1945 marked Japan's surrender, officially ending World War II.", "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop"),
            ("Cold War", "Post-WW2 political tension between US and Soviet Union", "The Cold War was a period of political tension between the US and Soviet Union from 1947-1991, without direct military conflict.", "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop"),
        ]
    },
    {
        "title": "World Geography",
        "description": "Major countries, capitals, and geographic facts",
        "category": "Geography",
        "terms": [
            ("France", "Capital: Paris. Located in Western Europe", "France is famous for the Eiffel Tower in Paris, wine, and the French Riviera. It's the largest country in Western Europe.", "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=400&fit=crop"),
            ("Japan", "Capital: Tokyo. Island nation in East Asia", "Japan consists of four main islands. Tokyo is one of the world's largest cities. Japan is known for technology, sushi, and cherry blossoms.", "https://images.unsplash.com/photo-1492571350019-22de08371fd3?w=400&h=400&fit=crop"),
            ("Brazil", "Capital: Brasília. Largest country in South America", "Brazil is the fifth largest country in the world. It's famous for the Amazon rainforest, soccer, and Carnival in Rio de Janeiro.", "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=400&h=400&fit=crop"),
            ("Egypt", "Capital: Cairo. Located in North Africa", "Egypt is home to the ancient pyramids and the Sphinx. The Nile River flows through Egypt, making it one of the world's oldest civilizations.", "https://images.unsplash.com/photo-1539650116574-75c0c6d73a6e?w=400&h=400&fit=crop"),
            ("Australia", "Capital: Canberra. Both a continent and country", "Australia is the world's smallest continent but sixth largest country. It's known for unique wildlife like kangaroos and the Great Barrier Reef.", "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop"),
            ("Canada", "Capital: Ottawa. Second largest country by area", "Canada is the second largest country in the world after Russia. It's known for maple syrup, hockey, and beautiful natural landscapes like Niagara Falls.", "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop"),
            ("India", "Capital: New Delhi. World's most populous democracy", "India is the second most populous country with over 1.4 billion people. It's famous for the Taj Mahal, Bollywood, and diverse cultures and languages.", "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&h=400&fit=crop"),
            ("Germany", "Capital: Berlin. Largest economy in Europe", "Germany is Europe's largest economy and most populous country. It's known for engineering, beer, and historical landmarks like the Brandenburg Gate.", "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=400&fit=crop"),
            ("Mexico", "Capital: Mexico City. Located south of the United States", "Mexico shares a border with the US. It's famous for ancient Mayan and Aztec ruins, tacos, and beautiful beaches like Cancún.", "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=400&h=400&fit=crop"),
            ("China", "Capital: Beijing. World's most populous country", "China has over 1.4 billion people. It's famous for the Great Wall, pandas, and being a major manufacturing center. Shanghai and Beijing are major cities.", "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400&h=400&fit=crop"),
        ]
    },
    {
        "title": "Mathematics - Algebra",
        "description": "Basic algebra terms with practical examples",
        "category": "Mathematics",
        "terms": [
            ("Variable", "Symbol representing an unknown value", "In the equation x + 5 = 10, x is a variable. Common variables are x, y, and z.", "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=400&fit=crop"),
            ("Equation", "Mathematical statement showing equality", "2x + 3 = 7 is an equation. To solve it, subtract 3 from both sides: 2x = 4, so x = 2.", "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=400&fit=crop"),
            ("Expression", "Mathematical phrase without an equals sign", "3x + 2y is an expression. It represents a value but doesn't state it equals something.", "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=400&fit=crop"),
            ("Coefficient", "Number multiplied by a variable", "In 3x, 3 is the coefficient. In 5y, 5 is the coefficient. Coefficients tell you how many times to multiply the variable.", "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=400&fit=crop"),
            ("Constant", "Fixed number that doesn't change", "In x + 5, 5 is a constant. In 2x - 7, -7 is a constant. Constants are numbers without variables.", "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=400&fit=crop"),
            ("Polynomial", "Expression with multiple terms", "x² + 3x + 2 is a polynomial with three terms. Polynomials can have variables raised to different powers.", "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=400&fit=crop"),
            ("Quadratic", "Polynomial of degree 2 (highest power is 2)", "ax² + bx + c is a quadratic equation. For example, x² + 5x + 6 = 0 is a quadratic equation.", "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=400&fit=crop"),
            ("Factor", "To break down an expression into simpler parts", "x² - 4 can be factored as (x+2)(x-2). Factoring helps solve equations and simplify expressions.", "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=400&fit=crop"),
            ("Solve", "To find the value of a variable", "To solve 2x = 10, divide both sides by 2: x = 5. Solving means finding what value makes the equation true.", "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=400&fit=crop"),
            ("Simplify", "To reduce an expression to its simplest form", "2x + 3x simplifies to 5x by combining like terms. Simplifying makes expressions easier to work with.", "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=400&fit=crop"),
        ]
    },
    {
        "title": "English Grammar",
        "description": "Parts of speech with sentence examples",
        "category": "Language",
        "terms": [
            ("Noun", "Word that names a person, place, thing, or idea", "Examples: 'dog' (thing), 'city' (place), 'happiness' (idea). In 'The dog barked', 'dog' is a noun.", "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=400&fit=crop"),
            ("Verb", "Word that shows action or state of being", "Examples: 'run' (action), 'think' (action), 'is' (state). In 'She runs fast', 'runs' is a verb.", "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=400&fit=crop"),
            ("Adjective", "Word that describes or modifies a noun", "Examples: 'beautiful' (describes appearance), 'tall' (describes height), 'red' (describes color). In 'the red car', 'red' is an adjective.", "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=400&fit=crop"),
            ("Adverb", "Word that describes a verb, adjective, or another adverb", "Examples: 'quickly' (how), 'very' (degree), 'happily' (manner). In 'She runs quickly', 'quickly' is an adverb.", "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=400&fit=crop"),
            ("Pronoun", "Word that replaces a noun", "Examples: 'he' (replaces a male name), 'she' (replaces a female name), 'it' (replaces a thing), 'they' (replaces multiple people). Instead of 'John went', we say 'He went'.", "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=400&fit=crop"),
            ("Preposition", "Word that shows relationship between words", "Examples: 'in' (location), 'on' (position), 'at' (place), 'under' (position). In 'The book is on the table', 'on' is a preposition.", "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=400&fit=crop"),
            ("Conjunction", "Word that connects words, phrases, or clauses", "Examples: 'and' (addition), 'but' (contrast), 'or' (choice). In 'I like apples and oranges', 'and' is a conjunction.", "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=400&fit=crop"),
            ("Interjection", "Word or phrase that expresses strong emotion", "Examples: 'Wow!' (surprise), 'Oh!' (realization), 'Ouch!' (pain). Interjections often end with exclamation marks.", "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=400&fit=crop"),
            ("Article", "Word that introduces a noun (a, an, the)", "Examples: 'the' (specific), 'a' (general, before consonant), 'an' (general, before vowel). 'The book' is specific, while 'a cat' is any cat.", "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=400&fit=crop"),
            ("Subject", "The person or thing that performs the action in a sentence", "In 'The dog barked', 'The dog' is the subject because it performs the action of barking. The subject usually comes before the verb.", "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=400&fit=crop"),
        ]
    },
    {
        "title": "Business Terms",
        "description": "Essential business vocabulary with real-world examples",
        "category": "Business",
        "terms": [
            ("Revenue", "Total income from business operations", "Revenue is money from sales. For example, if a store sells $10,000 worth of products, that's its revenue.", "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=400&fit=crop"),
            ("Expense", "Costs incurred in running a business", "Expenses are money spent on operations. Examples include rent, salaries, and utilities. Revenue minus expenses equals profit.", "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=400&fit=crop"),
            ("Asset", "Resource owned by a company that has value", "Assets include property, equipment, cash, and inventory. For example, a company's building and computers are assets.", "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=400&fit=crop"),
            ("Liability", "Debt or financial obligation a company owes", "Liabilities are what a company owes. Examples include loans, accounts payable, and mortgages. A company must pay its liabilities.", "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=400&fit=crop"),
            ("Equity", "Owner's stake in a company (Assets - Liabilities)", "Equity represents ownership value. If a company has $100,000 in assets and $40,000 in liabilities, its equity is $60,000.", "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=400&fit=crop"),
            ("ROI", "Return on Investment - measure of investment profitability", "ROI shows profit from investment. If you invest $1,000 and earn $1,200, your ROI is 20%. Higher ROI means better investment.", "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=400&fit=crop"),
            ("Marketing", "Activities to promote and sell products or services", "Marketing includes advertising, social media, and sales. For example, a company uses TV ads and social media to market its products.", "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=400&fit=crop"),
            ("Strategy", "Long-term plan to achieve business goals", "A business strategy is a plan for success. For example, a company's strategy might be to expand into new markets or improve product quality.", "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=400&fit=crop"),
            ("Stakeholder", "Person or group with interest in a business", "Stakeholders include investors, employees, customers, and suppliers. They all have a stake in the company's success.", "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=400&fit=crop"),
            ("Budget", "Financial plan for income and expenses", "A budget allocates money for different purposes. For example, a monthly budget might allocate $500 for rent, $300 for food, and $200 for savings.", "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=400&fit=crop"),
        ]
    },
]

# Class data - 3 classes with relevant study sets
CLASS_DATA = [
    {
        "name": "Language Learning - Spanish",
        "description": "Learn Spanish vocabulary and phrases for beginners",
        "is_public": True,
        "studyset_indices": [0]  # Spanish Basics
    },
    {
        "name": "Programming Fundamentals",
        "description": "Learn Python programming from basics to advanced concepts",
        "is_public": True,
        "studyset_indices": [1]  # Python Programming
    },
    {
        "name": "Science & Mathematics",
        "description": "Comprehensive study of Biology, Chemistry, Physics, and Algebra",
        "is_public": True,
        "studyset_indices": [2, 3, 4, 7]  # Biology (2), Chemistry (3), Physics (4), Algebra (7)
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
            category=data.get("category"),
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
