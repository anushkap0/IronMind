"""
A small curated knowledge base for the fitness RAG chatbot.
In production you'd load this from a CMS / database / docs folder,
but for a self-contained project we keep it inline as text chunks.
Each entry is a standalone "chunk" that can be retrieved independently.
"""

KNOWLEDGE_BASE = [
    {
        "id": "bmi-101",
        "topic": "BMI basics",
        "text": (
            "Body Mass Index (BMI) is weight in kilograms divided by height in meters squared. "
            "It is a screening tool, not a diagnostic one — it does not distinguish between fat "
            "and muscle mass, so athletes with high muscle mass can show an elevated BMI while "
            "being metabolically healthy. Categories: below 18.5 underweight, 18.5-24.9 normal, "
            "25-29.9 overweight, 30+ obese."
        ),
    },
    {
        "id": "calorie-deficit",
        "topic": "Weight loss",
        "text": (
            "To shed body fat, lose weight, or burn fat, sustainable fat loss generally comes "
            "from a moderate calorie deficit of 300-500 kcal below maintenance. Very large "
            "deficits accelerate muscle loss and often trigger rebound overeating. Pairing the "
            "deficit with resistance training preserves lean mass while losing fat. Aim for "
            "roughly 0.5-1% of bodyweight lost per week."
        ),
    },
    {
        "id": "calorie-surplus",
        "topic": "Muscle gain",
        "text": (
            "To build muscle, a small calorie surplus of 200-300 kcal above maintenance combined "
            "with progressive overload in strength training works best. Protein intake of roughly "
            "1.6-2.2 g per kg of bodyweight supports muscle protein synthesis. Rapid bulking leads "
            "to excess fat gain with little extra muscle."
        ),
    },
    {
        "id": "macros-basics",
        "topic": "Macronutrients",
        "text": (
            "Protein (4 kcal/g) supports muscle repair and satiety. Carbohydrates (4 kcal/g) fuel "
            "training performance and replenish glycogen. Fats (9 kcal/g) support hormone "
            "production; do not drop below roughly 20% of total calories from fat. A common "
            "starting split for active individuals is 30% protein, 40% carbs, 30% fat, adjusted "
            "per goal."
        ),
    },
    {
        "id": "strength-training-beginner",
        "topic": "Strength training for beginners",
        "text": (
            "Beginners respond well to full-body strength sessions 3 times per week focusing on "
            "compound lifts: squat, hinge (deadlift/RDL), push (bench/overhead press), and pull "
            "(row/pull-up). Start with 3 sets of 8-12 reps at a weight that leaves 2-3 reps in "
            "reserve, and add small load increases weekly (progressive overload)."
        ),
    },
    {
        "id": "cardio-guidance",
        "topic": "Cardio",
        "text": (
            "For general health, aim for 150 minutes of moderate cardio or 75 minutes of vigorous "
            "cardio per week (WHO guidance). For fat loss, steady-state cardio and HIIT are both "
            "effective; HIIT (e.g. 30s hard / 90s easy x 8) is more time-efficient but more "
            "fatiguing, so 2-3 sessions per week is usually enough alongside strength training."
        ),
    },
    {
        "id": "recovery-sleep",
        "topic": "Recovery",
        "text": (
            "Muscle adaptation happens during recovery, not just training. Aim for 7-9 hours of "
            "sleep, at least one full rest day per week, and deload every 4-6 weeks by reducing "
            "training volume by ~40% to manage fatigue and reduce injury risk."
        ),
    },
    {
        "id": "hydration",
        "topic": "Hydration",
        "text": (
            "A general guideline is 30-35 ml of water per kg of bodyweight per day, increased "
            "during intense training or hot climates. Mild dehydration (as little as 2% of "
            "bodyweight) can measurably reduce strength and endurance performance."
        ),
    },
    {
        "id": "workout-timer-hiit",
        "topic": "Interval training structure",
        "text": (
            "A classic HIIT structure uses work/rest intervals such as 40s work / 20s rest for "
            "8-10 rounds (Tabata-inspired), or 45s work / 15s rest for circuit training with 4-6 "
            "exercises per round. Warm up for 5 minutes and cool down/stretch for 5 minutes."
        ),
    },
    {
        "id": "underweight-guidance",
        "topic": "Underweight guidance",
        "text": (
            "For underweight individuals, prioritize a calorie surplus using calorie-dense whole "
            "foods (nuts, oats, dairy, olive oil, lean meats), 4-5 meals per day, and a structured "
            "progressive strength program to direct the extra calories toward muscle rather than "
            "just fat."
        ),
    },
    {
        "id": "overweight-guidance",
        "topic": "Overweight guidance",
        "text": (
            "For overweight/obese individuals starting out, low-impact cardio (walking, cycling, "
            "swimming) combined with full-body resistance training 2-3x/week reduces injury risk "
            "while building the habit. Tracking food intake for 1-2 weeks often reveals the "
            "biggest, easiest changes to make first."
        ),
    },
    {
        "id": "app-features",
        "topic": "About this app",
        "text": (
            "This fitness app lets users calculate their BMI, receive a tailored workout and diet "
            "routine based on their goal (lose, maintain, or gain weight), use a guided workout "
            "timer for interval training, and chat with an AI coach for follow-up recommendations."
        ),
    },
]
