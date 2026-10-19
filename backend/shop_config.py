# PLACEHOLDER shop info. Seeded once into MongoDB `settings` collection (key="shop").
# To swap: edit the DB doc directly, or edit here and delete the DB doc + restart backend.
DEFAULT_SHOP_SETTINGS = {
    "key": "shop",
    "is_placeholder": True,
    "name": "Apex Collision & Body",
    "logo_text": "APEX",
    "logo_subtext": "Collision & Body",
    "logo_url": None,
    "tagline": "Precision collision repair, custom paint & factory-perfect finishes.",
    "phone": "(555) 010-2834",
    "email": "service@example.com",
    "address_line1": "1234 Placeholder Ave",
    "address_line2": "Your City, ST 00000",
    "hours": [
        {"days": "Mon – Fri", "time": "8:00 AM – 6:00 PM"},
        {"days": "Saturday", "time": "9:00 AM – 2:00 PM"},
        {"days": "Sunday", "time": "Closed"},
    ],
    "services": [
        {"id": "collision", "title": "Collision Repair", "icon": "car",
         "description": "Structural and body repair after accidents, restored to factory spec."},
        {"id": "paint", "title": "Custom Paint", "icon": "paint",
         "description": "Computer color-matched refinishing and full custom paint jobs."},
        {"id": "dent", "title": "Dent Repair", "icon": "hammer",
         "description": "Door dings, hail and panel dents removed cleanly."},
        {"id": "bumper", "title": "Bumper Repair", "icon": "shield",
         "description": "Cracked, scuffed or pushed-in bumpers repaired or replaced."},
        {"id": "scratch", "title": "Scratch & Chip Repair", "icon": "sparkles",
         "description": "Key scratches, rock chips and clearcoat damage blended invisibly."},
        {"id": "insurance", "title": "Insurance Claims", "icon": "file",
         "description": "We work with your insurer and help you through the claim."},
    ],
    "time_slots": ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"],
    "timezone": "America/New_York",
    "notification_email": "owner@example.com",
}

IMG_BASE = "https://static.stage-images.emergentagent.com/jobs/aad34263-6c31-4c90-a3f5-3fd91b8955ee/images/"

SAMPLE_GALLERY = [
    {"title": "Candy Red Fender Refinish", "category": "Custom Paint", "url": IMG_BASE + "c1112f0e0a220460a013e99778aca670cd58af48c85eefded976e749984af612.jpeg"},
    {"title": "Frame Straightening", "category": "Collision Repair", "url": IMG_BASE + "b4217d45f47967b7bafd31c2ed2ed72144e36a0edff9913af67e404dbc5589ae.jpeg"},
    {"title": "Two-Tone Muscle Car", "category": "Custom Paint", "url": IMG_BASE + "3a4ed27808c16f6229154b6745fda84990d0dda947177e19993bc9d9bdbf0c19.jpeg"},
    {"title": "SUV Bumper Repair", "category": "Bumper Repair", "url": IMG_BASE + "329d7cc5953b7f6107143b5ff4f6be022a94d7824c9840781c03996ef7749eab.jpeg"},
    {"title": "Paintless Dent Removal", "category": "Dent Repair", "url": IMG_BASE + "041d01e063968306ad18b53942c6ea94869c3ab39096996fc2adde3a2ba40883.jpeg"},
    {"title": "Mirror Finish Polish", "category": "Scratch & Chip", "url": IMG_BASE + "172fd1863497bb60b0b30d62fa2168aacd29d0aa77a365372234cd351f11b656.jpeg"},
]

SAMPLE_REVIEWS = [
    {"name": "Marcus T.", "rating": 5, "text": "Rear-ended on the highway and they made my car look brand new. Paint match is perfect and they handled everything with my insurance."},
    {"name": "Jessica R.", "rating": 5, "text": "Fast, honest and fair pricing. Fixed a nasty bumper scrape in two days. Highly recommend."},
    {"name": "David L.", "rating": 4, "text": "Great work on my door dent. Communication was excellent and the car came back spotless."},
    {"name": "Priya S.", "rating": 5, "text": "Custom color on my project car came out incredible. These guys care about the details."},
]
