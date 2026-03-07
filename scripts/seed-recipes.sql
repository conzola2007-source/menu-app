-- Seed 30 global recipes
-- Run in Supabase SQL Editor (bypasses RLS)
-- Idempotent: skips existing recipes by title

DO $$
DECLARE rid uuid;
BEGIN

-- ── ITALIAN ────────────────────────────────────────────────────────────────

SELECT id INTO rid FROM recipes WHERE title = 'Spaghetti Carbonara' AND is_global = true;
IF rid IS NULL THEN
  INSERT INTO recipes (title,description,cuisine,carb_type,protein_type,prep_time_min,cook_time_min,servings,emoji,bg_color,advance_prep_days,advance_prep_note,is_global,household_id,created_by)
  VALUES ('Spaghetti Carbonara','Classic Roman pasta with eggs, guanciale, pecorino, and black pepper. No cream — ever.','italian','pasta','pork',10,20,4,'🍝','#f59e0b',0,null,true,null,null)
  RETURNING id INTO rid;
  INSERT INTO recipe_ingredients (recipe_id,name,amount,unit,storage_location,sort_order) VALUES
    (rid,'Spaghetti',400,'g','pantry',0),(rid,'Guanciale or pancetta',200,'g','fridge',1),
    (rid,'Eggs',4,'qty','fridge',2),(rid,'Pecorino Romano',100,'g','fridge',3),
    (rid,'Black pepper',2,'tsp','pantry',4),(rid,'Salt',1,'tbsp','pantry',5);
  INSERT INTO recipe_steps (recipe_id,instruction,step_order) VALUES
    (rid,'Cook spaghetti in well-salted boiling water until al dente, reserving 200 ml pasta water.',0),
    (rid,'Fry guanciale in a pan over medium heat until crispy. Remove pan from heat.',1),
    (rid,'Whisk together eggs, grated pecorino, and plenty of black pepper in a bowl.',2),
    (rid,'Add hot drained pasta to the guanciale pan. Toss off heat.',3),
    (rid,'Pour egg mixture over pasta and toss rapidly, adding pasta water a splash at a time until creamy.',4),
    (rid,'Serve immediately topped with more pecorino and black pepper.',5);
END IF;

SELECT id INTO rid FROM recipes WHERE title = 'Margherita Pizza' AND is_global = true;
IF rid IS NULL THEN
  INSERT INTO recipes (title,description,cuisine,carb_type,protein_type,prep_time_min,cook_time_min,servings,emoji,bg_color,advance_prep_days,advance_prep_note,is_global,household_id,created_by)
  VALUES ('Margherita Pizza','Neapolitan-style pizza with tomato sauce, fresh mozzarella, and basil.','italian','bread','none',30,12,4,'🍕','#ef4444',1,'Dough needs overnight cold ferment for best flavour.',true,null,null)
  RETURNING id INTO rid;
  INSERT INTO recipe_ingredients (recipe_id,name,amount,unit,storage_location,sort_order) VALUES
    (rid,'00 flour',500,'g','pantry',0),(rid,'Active dry yeast',7,'g','pantry',1),
    (rid,'Water (warm)',325,'ml','pantry',2),(rid,'Olive oil',2,'tbsp','pantry',3),
    (rid,'Salt',1,'tsp','pantry',4),(rid,'Crushed tomatoes',400,'g','pantry',5),
    (rid,'Fresh mozzarella',250,'g','fridge',6),(rid,'Fresh basil',20,'g','fridge',7);
  INSERT INTO recipe_steps (recipe_id,instruction,step_order) VALUES
    (rid,'Mix flour, yeast, salt. Add water + olive oil and knead 10 min. Rest in fridge overnight.',0),
    (rid,'Preheat oven to max (ideally 250°C) with a pizza stone or heavy baking tray.',1),
    (rid,'Stretch dough balls into 30 cm rounds on floured surface.',2),
    (rid,'Spread crushed tomatoes, top with torn mozzarella. Do not add basil yet.',3),
    (rid,'Bake 10–12 min until crust is puffed and charred at edges.',4),
    (rid,'Top with fresh basil and a drizzle of olive oil before serving.',5);
END IF;

SELECT id INTO rid FROM recipes WHERE title = 'Mushroom Risotto' AND is_global = true;
IF rid IS NULL THEN
  INSERT INTO recipes (title,description,cuisine,carb_type,protein_type,prep_time_min,cook_time_min,servings,emoji,bg_color,advance_prep_days,advance_prep_note,is_global,household_id,created_by)
  VALUES ('Mushroom Risotto','Creamy Arborio rice with mixed mushrooms, white wine, and Parmesan.','italian','rice','none',15,35,4,'🍄','#d97706',0,null,true,null,null)
  RETURNING id INTO rid;
  INSERT INTO recipe_ingredients (recipe_id,name,amount,unit,storage_location,sort_order) VALUES
    (rid,'Arborio rice',320,'g','pantry',0),(rid,'Mixed mushrooms',400,'g','fridge',1),
    (rid,'Vegetable or chicken stock',1200,'ml','pantry',2),(rid,'White wine',150,'ml','pantry',3),
    (rid,'Onion, diced',1,'qty','pantry',4),(rid,'Garlic cloves, minced',2,'qty','pantry',5),
    (rid,'Parmesan, grated',80,'g','fridge',6),(rid,'Butter',40,'g','fridge',7),
    (rid,'Olive oil',2,'tbsp','pantry',8);
  INSERT INTO recipe_steps (recipe_id,instruction,step_order) VALUES
    (rid,'Heat stock in a separate pan and keep warm over low heat.',0),
    (rid,'Sauté onion and garlic in butter + oil until soft. Add mushrooms and cook 5 min.',1),
    (rid,'Add rice and toast 2 min, stirring. Pour in wine and stir until absorbed.',2),
    (rid,'Add warm stock one ladle at a time, stirring constantly, waiting for each addition to absorb.',3),
    (rid,'After ~20 min when rice is al dente, remove from heat. Stir in cold butter and Parmesan.',4),
    (rid,'Rest covered 2 min. Season and serve immediately.',5);
END IF;

SELECT id INTO rid FROM recipes WHERE title = 'Chicken Piccata' AND is_global = true;
IF rid IS NULL THEN
  INSERT INTO recipes (title,description,cuisine,carb_type,protein_type,prep_time_min,cook_time_min,servings,emoji,bg_color,advance_prep_days,advance_prep_note,is_global,household_id,created_by)
  VALUES ('Chicken Piccata','Pan-fried chicken cutlets in a bright lemon-caper butter sauce.','italian','none','chicken',15,20,4,'🍋','#84cc16',0,null,true,null,null)
  RETURNING id INTO rid;
  INSERT INTO recipe_ingredients (recipe_id,name,amount,unit,storage_location,sort_order) VALUES
    (rid,'Chicken breasts, butterflied',600,'g','fridge',0),(rid,'Plain flour',60,'g','pantry',1),
    (rid,'Lemon juice',60,'ml','fridge',2),(rid,'Capers',2,'tbsp','pantry',3),
    (rid,'Chicken stock',120,'ml','pantry',4),(rid,'Butter',40,'g','fridge',5),
    (rid,'Olive oil',2,'tbsp','pantry',6),(rid,'Parsley, chopped',15,'g','fridge',7);
  INSERT INTO recipe_steps (recipe_id,instruction,step_order) VALUES
    (rid,'Pound chicken to even 1 cm thickness. Season and dredge in flour, shaking off excess.',0),
    (rid,'Heat oil in pan over medium-high. Cook chicken 3–4 min per side until golden. Set aside.',1),
    (rid,'Add stock and lemon juice to pan. Scrape up any browned bits. Simmer 2 min.',2),
    (rid,'Add capers and butter. Swirl to emulsify. Return chicken and coat in sauce.',3),
    (rid,'Garnish with parsley and extra lemon slices. Serve immediately.',4);
END IF;

-- ── MEXICAN ────────────────────────────────────────────────────────────────

SELECT id INTO rid FROM recipes WHERE title = 'Chicken Tacos' AND is_global = true;
IF rid IS NULL THEN
  INSERT INTO recipes (title,description,cuisine,carb_type,protein_type,prep_time_min,cook_time_min,servings,emoji,bg_color,advance_prep_days,advance_prep_note,is_global,household_id,created_by)
  VALUES ('Chicken Tacos','Smoky chipotle chicken in soft corn tortillas with avocado and pickled onion.','mexican','bread','chicken',20,15,4,'🌮','#f97316',0,null,true,null,null)
  RETURNING id INTO rid;
  INSERT INTO recipe_ingredients (recipe_id,name,amount,unit,storage_location,sort_order) VALUES
    (rid,'Chicken thighs, boneless',600,'g','fridge',0),(rid,'Corn tortillas',12,'piece','pantry',1),
    (rid,'Chipotle in adobo',2,'tbsp','pantry',2),(rid,'Avocado',2,'qty','pantry',3),
    (rid,'Red onion, thinly sliced',1,'qty','pantry',4),(rid,'Lime juice',60,'ml','pantry',5),
    (rid,'Cumin',1,'tsp','pantry',6),(rid,'Coriander leaves',20,'g','fridge',7),
    (rid,'Sour cream',120,'ml','fridge',8);
  INSERT INTO recipe_steps (recipe_id,instruction,step_order) VALUES
    (rid,'Quick-pickle onion: combine with lime juice, pinch of salt. Leave 15 min.',0),
    (rid,'Mix chipotle, cumin, salt. Coat chicken thighs. Pan-fry or grill 6–7 min per side.',1),
    (rid,'Rest chicken 5 min then slice or shred. Mash avocado with lime and salt.',2),
    (rid,'Warm tortillas in a dry pan 30 sec per side.',3),
    (rid,'Assemble: avocado → chicken → pickled onion → coriander → sour cream.',4);
END IF;

SELECT id INTO rid FROM recipes WHERE title = 'Beef Enchiladas' AND is_global = true;
IF rid IS NULL THEN
  INSERT INTO recipes (title,description,cuisine,carb_type,protein_type,prep_time_min,cook_time_min,servings,emoji,bg_color,advance_prep_days,advance_prep_note,is_global,household_id,created_by)
  VALUES ('Beef Enchiladas','Corn tortillas stuffed with spiced beef, smothered in red chile sauce and melted cheese.','mexican','bread','beef',30,30,4,'🫔','#dc2626',0,null,true,null,null)
  RETURNING id INTO rid;
  INSERT INTO recipe_ingredients (recipe_id,name,amount,unit,storage_location,sort_order) VALUES
    (rid,'Minced beef',500,'g','fridge',0),(rid,'Corn tortillas',8,'piece','pantry',1),
    (rid,'Red enchilada sauce',400,'ml','pantry',2),(rid,'Cheddar cheese, grated',200,'g','fridge',3),
    (rid,'Onion, diced',1,'qty','pantry',4),(rid,'Garlic',2,'qty','pantry',5),
    (rid,'Cumin',2,'tsp','pantry',6),(rid,'Smoked paprika',1,'tsp','pantry',7);
  INSERT INTO recipe_steps (recipe_id,instruction,step_order) VALUES
    (rid,'Preheat oven to 190°C. Brown beef with onion and garlic. Add cumin, paprika, salt.',0),
    (rid,'Dip each tortilla briefly in enchilada sauce to soften.',1),
    (rid,'Fill each tortilla with beef mixture, roll tightly, place seam-side down in baking dish.',2),
    (rid,'Pour remaining sauce over top. Cover generously with cheese.',3),
    (rid,'Bake 25–30 min until bubbly and cheese is golden.',4);
END IF;

SELECT id INTO rid FROM recipes WHERE title = 'Black Bean Burritos' AND is_global = true;
IF rid IS NULL THEN
  INSERT INTO recipes (title,description,cuisine,carb_type,protein_type,prep_time_min,cook_time_min,servings,emoji,bg_color,advance_prep_days,advance_prep_note,is_global,household_id,created_by)
  VALUES ('Black Bean Burritos','Hearty vegetarian burritos with black beans, rice, charred corn, and jalapeño.','mexican','rice','none',20,20,4,'🌯','#78716c',0,null,true,null,null)
  RETURNING id INTO rid;
  INSERT INTO recipe_ingredients (recipe_id,name,amount,unit,storage_location,sort_order) VALUES
    (rid,'Black beans (canned, drained)',400,'g','pantry',0),(rid,'Basmati rice',200,'g','pantry',1),
    (rid,'Large flour tortillas',4,'piece','pantry',2),(rid,'Sweetcorn (canned or frozen)',150,'g','pantry',3),
    (rid,'Red pepper, diced',1,'qty','fridge',4),(rid,'Jalapeño, sliced',1,'qty','pantry',5),
    (rid,'Lime',2,'qty','pantry',6),(rid,'Cheddar cheese, grated',100,'g','fridge',7),
    (rid,'Sour cream',100,'ml','fridge',8);
  INSERT INTO recipe_steps (recipe_id,instruction,step_order) VALUES
    (rid,'Cook rice per packet instructions with a pinch of cumin and lime zest.',0),
    (rid,'Char corn in dry pan 3–4 min. Add beans, red pepper, cumin. Season.',1),
    (rid,'Warm tortillas. Layer rice, bean mix, jalapeño, cheese, sour cream.',2),
    (rid,'Fold sides in, roll burrito tightly. Toast in pan seam-side down 2 min.',3),
    (rid,'Serve with lime wedges and extra sour cream.',4);
END IF;

-- ── CHINESE ────────────────────────────────────────────────────────────────

SELECT id INTO rid FROM recipes WHERE title = 'Egg Fried Rice' AND is_global = true;
IF rid IS NULL THEN
  INSERT INTO recipes (title,description,cuisine,carb_type,protein_type,prep_time_min,cook_time_min,servings,emoji,bg_color,advance_prep_days,advance_prep_note,is_global,household_id,created_by)
  VALUES ('Egg Fried Rice','Classic wok fried rice with egg, vegetables, and soy sauce. Best made with day-old rice.','chinese','rice','eggs',10,15,4,'🍚','#eab308',0,null,true,null,null)
  RETURNING id INTO rid;
  INSERT INTO recipe_ingredients (recipe_id,name,amount,unit,storage_location,sort_order) VALUES
    (rid,'Cooked jasmine rice (cold)',600,'g','fridge',0),(rid,'Eggs',3,'qty','fridge',1),
    (rid,'Spring onions',4,'qty','fridge',2),(rid,'Frozen peas',100,'g','freezer',3),
    (rid,'Soy sauce',3,'tbsp','pantry',4),(rid,'Sesame oil',1,'tbsp','pantry',5),
    (rid,'Vegetable oil',3,'tbsp','pantry',6),(rid,'Garlic cloves, minced',2,'qty','pantry',7);
  INSERT INTO recipe_steps (recipe_id,instruction,step_order) VALUES
    (rid,'Heat wok over very high heat until smoking. Add oil.',0),
    (rid,'Add garlic, stir-fry 30 sec. Crack in eggs and scramble quickly.',1),
    (rid,'Add cold rice, breaking up clumps. Stir-fry vigorously 3–4 min.',2),
    (rid,'Add peas and white parts of spring onion. Toss 2 min.',3),
    (rid,'Pour in soy sauce and sesame oil. Toss once more.',4),
    (rid,'Top with green spring onion tops. Serve hot.',5);
END IF;

SELECT id INTO rid FROM recipes WHERE title = 'Pork Dumplings (Gyoza)' AND is_global = true;
IF rid IS NULL THEN
  INSERT INTO recipes (title,description,cuisine,carb_type,protein_type,prep_time_min,cook_time_min,servings,emoji,bg_color,advance_prep_days,advance_prep_note,is_global,household_id,created_by)
  VALUES ('Pork Dumplings (Gyoza)','Pan-fried and steamed dumplings with a pork and cabbage filling.','chinese','other','pork',45,15,4,'🥟','#a3a3a3',0,null,true,null,null)
  RETURNING id INTO rid;
  INSERT INTO recipe_ingredients (recipe_id,name,amount,unit,storage_location,sort_order) VALUES
    (rid,'Gyoza wrappers',32,'piece','fridge',0),(rid,'Minced pork',300,'g','fridge',1),
    (rid,'Cabbage, finely shredded',150,'g','fridge',2),(rid,'Ginger, grated',2,'tsp','pantry',3),
    (rid,'Garlic, minced',2,'qty','pantry',4),(rid,'Soy sauce',2,'tbsp','pantry',5),
    (rid,'Sesame oil',1,'tsp','pantry',6),(rid,'Vegetable oil',2,'tbsp','pantry',7);
  INSERT INTO recipe_steps (recipe_id,instruction,step_order) VALUES
    (rid,'Salt cabbage, squeeze out moisture. Mix with pork, ginger, garlic, soy, sesame oil.',0),
    (rid,'Place 1 tsp filling in each wrapper. Wet edge, fold and pleat to seal.',1),
    (rid,'Heat oil in pan over medium-high. Add dumplings flat-side down. Fry 2 min until golden.',2),
    (rid,'Add 60 ml water, cover immediately. Steam 5 min until water evaporated.',3),
    (rid,'Uncover, fry 1 more min to re-crisp base. Serve with dipping sauce (soy + rice vinegar).',4);
END IF;

SELECT id INTO rid FROM recipes WHERE title = 'Kung Pao Chicken' AND is_global = true;
IF rid IS NULL THEN
  INSERT INTO recipes (title,description,cuisine,carb_type,protein_type,prep_time_min,cook_time_min,servings,emoji,bg_color,advance_prep_days,advance_prep_note,is_global,household_id,created_by)
  VALUES ('Kung Pao Chicken','Spicy Sichuan stir-fry with chicken, peanuts, dried chillies, and Sichuan peppercorns.','chinese','rice','chicken',20,15,4,'🌶️','#b91c1c',0,null,true,null,null)
  RETURNING id INTO rid;
  INSERT INTO recipe_ingredients (recipe_id,name,amount,unit,storage_location,sort_order) VALUES
    (rid,'Chicken breast, diced',500,'g','fridge',0),(rid,'Roasted peanuts',80,'g','pantry',1),
    (rid,'Dried red chillies',8,'qty','pantry',2),(rid,'Sichuan peppercorns',1,'tsp','pantry',3),
    (rid,'Soy sauce',3,'tbsp','pantry',4),(rid,'Rice vinegar',1,'tbsp','pantry',5),
    (rid,'Cornflour',2,'tsp','pantry',6),(rid,'Sugar',1,'tsp','pantry',7),
    (rid,'Spring onions',3,'qty','fridge',8);
  INSERT INTO recipe_steps (recipe_id,instruction,step_order) VALUES
    (rid,'Marinate chicken with 1 tbsp soy sauce and cornflour for 15 min.',0),
    (rid,'Mix sauce: remaining soy, rice vinegar, sugar, 1 tsp cornflour.',1),
    (rid,'Fry chillies and Sichuan peppercorns in hot oil 30 sec until fragrant.',2),
    (rid,'Add chicken and stir-fry on high heat until cooked through, 4–5 min.',3),
    (rid,'Pour sauce over, toss. Add peanuts and spring onions. Serve with steamed rice.',4);
END IF;

-- ── JAPANESE ───────────────────────────────────────────────────────────────

SELECT id INTO rid FROM recipes WHERE title = 'Chicken Teriyaki Bowl' AND is_global = true;
IF rid IS NULL THEN
  INSERT INTO recipes (title,description,cuisine,carb_type,protein_type,prep_time_min,cook_time_min,servings,emoji,bg_color,advance_prep_days,advance_prep_note,is_global,household_id,created_by)
  VALUES ('Chicken Teriyaki Bowl','Glazed chicken thighs in homemade teriyaki sauce over steamed rice with pickled ginger.','japanese','rice','chicken',15,20,4,'🍱','#0891b2',0,null,true,null,null)
  RETURNING id INTO rid;
  INSERT INTO recipe_ingredients (recipe_id,name,amount,unit,storage_location,sort_order) VALUES
    (rid,'Chicken thighs, boneless',600,'g','fridge',0),(rid,'Soy sauce',4,'tbsp','pantry',1),
    (rid,'Mirin',3,'tbsp','pantry',2),(rid,'Sake or dry sherry',2,'tbsp','pantry',3),
    (rid,'Sugar',1,'tbsp','pantry',4),(rid,'Jasmine rice',320,'g','pantry',5),
    (rid,'Pickled ginger',40,'g','fridge',6),(rid,'Sesame seeds',1,'tbsp','pantry',7);
  INSERT INTO recipe_steps (recipe_id,instruction,step_order) VALUES
    (rid,'Cook rice per packet. Mix soy, mirin, sake, sugar in a small pan. Simmer 3 min until slightly thick.',0),
    (rid,'Score chicken thighs on the skin side. Season with salt.',1),
    (rid,'Cook skin-side down in oiled pan 5 min. Flip and cook 4 more min.',2),
    (rid,'Pour teriyaki sauce over chicken. Simmer 2–3 min, basting, until glazed.',3),
    (rid,'Slice chicken and serve over rice with pickled ginger and sesame seeds.',4);
END IF;

SELECT id INTO rid FROM recipes WHERE title = 'Tonkotsu Ramen' AND is_global = true;
IF rid IS NULL THEN
  INSERT INTO recipes (title,description,cuisine,carb_type,protein_type,prep_time_min,cook_time_min,servings,emoji,bg_color,advance_prep_days,advance_prep_note,is_global,household_id,created_by)
  VALUES ('Tonkotsu Ramen','Rich pork bone broth ramen with chashu belly, soft egg, nori, and bamboo shoots.','japanese','noodles','pork',30,240,4,'🍜','#c2410c',1,'Broth is best started the day before. Chashu can also be prepared ahead.',true,null,null)
  RETURNING id INTO rid;
  INSERT INTO recipe_ingredients (recipe_id,name,amount,unit,storage_location,sort_order) VALUES
    (rid,'Pork neck bones',1000,'g','freezer',0),(rid,'Pork belly',400,'g','fridge',1),
    (rid,'Ramen noodles',400,'g','pantry',2),(rid,'Eggs',4,'qty','fridge',3),
    (rid,'Soy sauce',4,'tbsp','pantry',4),(rid,'Mirin',2,'tbsp','pantry',5),
    (rid,'Bamboo shoots (canned)',100,'g','pantry',6),(rid,'Nori sheets',4,'piece','pantry',7),
    (rid,'Spring onions',4,'qty','fridge',8);
  INSERT INTO recipe_steps (recipe_id,instruction,step_order) VALUES
    (rid,'Blanch pork bones 5 min, drain, rinse. Simmer in 2.5 L water 4 hours until milky white.',0),
    (rid,'Roll pork belly tightly, tie with string. Braise in soy + mirin + water 2 hours. Cool, slice.',1),
    (rid,'Soft-boil eggs 6.5 min, marinate in leftover chashu braising liquid overnight.',2),
    (rid,'Season broth with salt and tare (soy + mirin). Taste and adjust.',3),
    (rid,'Cook noodles per packet. Ladle hot broth into bowls, add noodles.',4),
    (rid,'Top each bowl with chashu, halved marinated egg, bamboo shoots, nori, spring onion.',5);
END IF;

SELECT id INTO rid FROM recipes WHERE title = 'Miso Salmon' AND is_global = true;
IF rid IS NULL THEN
  INSERT INTO recipes (title,description,cuisine,carb_type,protein_type,prep_time_min,cook_time_min,servings,emoji,bg_color,advance_prep_days,advance_prep_note,is_global,household_id,created_by)
  VALUES ('Miso Salmon','Oven-roasted salmon fillets with a sweet white miso and mirin glaze.','japanese','rice','fish',10,12,4,'🐟','#f97316',0,null,true,null,null)
  RETURNING id INTO rid;
  INSERT INTO recipe_ingredients (recipe_id,name,amount,unit,storage_location,sort_order) VALUES
    (rid,'Salmon fillets',4,'piece','fridge',0),(rid,'White miso paste',3,'tbsp','fridge',1),
    (rid,'Mirin',2,'tbsp','pantry',2),(rid,'Sake',1,'tbsp','pantry',3),
    (rid,'Sugar',1,'tsp','pantry',4),(rid,'Jasmine rice',320,'g','pantry',5),
    (rid,'Sesame seeds',1,'tbsp','pantry',6),(rid,'Spring onions',2,'qty','fridge',7);
  INSERT INTO recipe_steps (recipe_id,instruction,step_order) VALUES
    (rid,'Whisk miso, mirin, sake, sugar. Coat salmon fillets and marinate 15 min (or overnight).',0),
    (rid,'Preheat grill/broiler to high. Line baking tray with foil.',1),
    (rid,'Grill salmon 8–12 min until caramelised and cooked through. Watch carefully — miso burns quickly.',2),
    (rid,'Serve over rice, sprinkled with sesame seeds and sliced spring onions.',3);
END IF;

-- ── INDIAN ─────────────────────────────────────────────────────────────────

SELECT id INTO rid FROM recipes WHERE title = 'Butter Chicken' AND is_global = true;
IF rid IS NULL THEN
  INSERT INTO recipes (title,description,cuisine,carb_type,protein_type,prep_time_min,cook_time_min,servings,emoji,bg_color,advance_prep_days,advance_prep_note,is_global,household_id,created_by)
  VALUES ('Butter Chicken','Tender chicken in a rich tomato, cream, and spiced butter sauce. Serve with naan.','indian','bread','chicken',20,40,4,'🍛','#ea580c',0,null,true,null,null)
  RETURNING id INTO rid;
  INSERT INTO recipe_ingredients (recipe_id,name,amount,unit,storage_location,sort_order) VALUES
    (rid,'Chicken thighs, cubed',700,'g','fridge',0),(rid,'Natural yoghurt',150,'ml','fridge',1),
    (rid,'Butter',50,'g','fridge',2),(rid,'Tinned tomatoes',400,'g','pantry',3),
    (rid,'Double cream',120,'ml','fridge',4),(rid,'Onion',1,'qty','pantry',5),
    (rid,'Garlic cloves',4,'qty','pantry',6),(rid,'Fresh ginger',2,'tbsp','fridge',7),
    (rid,'Garam masala',2,'tsp','pantry',8),(rid,'Cumin',1,'tsp','pantry',9),
    (rid,'Turmeric',0.5,'tsp','pantry',10);
  INSERT INTO recipe_steps (recipe_id,instruction,step_order) VALUES
    (rid,'Marinate chicken in yoghurt, garam masala, cumin, turmeric for at least 1 hr. Grill or pan-fry until charred.',0),
    (rid,'Fry onion, garlic, ginger in butter until golden.',1),
    (rid,'Add tomatoes, blitz smooth with stick blender. Simmer 15 min.',2),
    (rid,'Add chicken and cream. Simmer 15 min. Season.',3),
    (rid,'Serve with naan or basmati rice and garnish with cream swirl and coriander.',4);
END IF;

SELECT id INTO rid FROM recipes WHERE title = 'Lamb Biryani' AND is_global = true;
IF rid IS NULL THEN
  INSERT INTO recipes (title,description,cuisine,carb_type,protein_type,prep_time_min,cook_time_min,servings,emoji,bg_color,advance_prep_days,advance_prep_note,is_global,household_id,created_by)
  VALUES ('Lamb Biryani','Fragrant slow-cooked lamb layered with saffron basmati rice and caramelised onions.','indian','rice','lamb',40,90,6,'🍖','#b45309',1,'Best to marinate lamb overnight in yoghurt and spices.',true,null,null)
  RETURNING id INTO rid;
  INSERT INTO recipe_ingredients (recipe_id,name,amount,unit,storage_location,sort_order) VALUES
    (rid,'Lamb shoulder, cubed',800,'g','fridge',0),(rid,'Basmati rice',400,'g','pantry',1),
    (rid,'Yoghurt',200,'ml','fridge',2),(rid,'Large onions',3,'qty','pantry',3),
    (rid,'Saffron',0.5,'tsp','pantry',4),(rid,'Warm milk',50,'ml','fridge',5),
    (rid,'Garam masala',2,'tsp','pantry',6),(rid,'Cardamom pods',6,'qty','pantry',7),
    (rid,'Bay leaves',2,'qty','pantry',8),(rid,'Ghee or butter',60,'g','fridge',9);
  INSERT INTO recipe_steps (recipe_id,instruction,step_order) VALUES
    (rid,'Marinate lamb in yoghurt, garam masala, salt overnight. Steep saffron in warm milk.',0),
    (rid,'Fry sliced onions in ghee until deep golden and crispy. Set aside half for topping.',1),
    (rid,'Cook marinated lamb with remaining onions until tender, 60–90 min on low.',2),
    (rid,'Parboil rice with cardamom and bay until 70% cooked. Drain.',3),
    (rid,'Layer: lamb → parboiled rice → saffron milk → reserved onions. Cover tightly. Cook on very low 25 min (dum).',4),
    (rid,'Gently fold layers once and serve with raita.',5);
END IF;

SELECT id INTO rid FROM recipes WHERE title = 'Red Lentil Dal' AND is_global = true;
IF rid IS NULL THEN
  INSERT INTO recipes (title,description,cuisine,carb_type,protein_type,prep_time_min,cook_time_min,servings,emoji,bg_color,advance_prep_days,advance_prep_note,is_global,household_id,created_by)
  VALUES ('Red Lentil Dal','Comforting spiced red lentil soup with a tadka of cumin, mustard seeds, and curry leaves.','indian','none','none',10,30,4,'🫕','#b45309',0,null,true,null,null)
  RETURNING id INTO rid;
  INSERT INTO recipe_ingredients (recipe_id,name,amount,unit,storage_location,sort_order) VALUES
    (rid,'Red lentils',300,'g','pantry',0),(rid,'Tinned tomatoes',400,'g','pantry',1),
    (rid,'Onion',1,'qty','pantry',2),(rid,'Garlic cloves',3,'qty','pantry',3),
    (rid,'Fresh ginger',1,'tbsp','fridge',4),(rid,'Coconut milk',200,'ml','pantry',5),
    (rid,'Cumin seeds',1,'tsp','pantry',6),(rid,'Mustard seeds',1,'tsp','pantry',7),
    (rid,'Curry leaves',10,'qty','pantry',8),(rid,'Turmeric',1,'tsp','pantry',9);
  INSERT INTO recipe_steps (recipe_id,instruction,step_order) VALUES
    (rid,'Rinse lentils. Simmer with 800 ml water, turmeric, and salt until soft, 20 min. Stir occasionally.',0),
    (rid,'Sauté onion until golden. Add garlic, ginger, tomatoes. Cook 5 min.',1),
    (rid,'Add coconut milk and tomato-onion base to lentils. Simmer 10 more min.',2),
    (rid,'Make tadka: heat oil in small pan, pop mustard seeds, add cumin and curry leaves 30 sec.',3),
    (rid,'Pour sizzling tadka over dal. Serve with rice or chapati.',4);
END IF;

-- ── AMERICAN ───────────────────────────────────────────────────────────────

SELECT id INTO rid FROM recipes WHERE title = 'Classic Beef Burgers' AND is_global = true;
IF rid IS NULL THEN
  INSERT INTO recipes (title,description,cuisine,carb_type,protein_type,prep_time_min,cook_time_min,servings,emoji,bg_color,advance_prep_days,advance_prep_note,is_global,household_id,created_by)
  VALUES ('Classic Beef Burgers','Juicy smash-style beef patties with melted American cheese, pickles, and special sauce.','american','bread','beef',15,15,4,'🍔','#dc2626',0,null,true,null,null)
  RETURNING id INTO rid;
  INSERT INTO recipe_ingredients (recipe_id,name,amount,unit,storage_location,sort_order) VALUES
    (rid,'Minced beef (20% fat)',600,'g','fridge',0),(rid,'Burger buns',4,'qty','pantry',1),
    (rid,'American cheese slices',4,'piece','fridge',2),(rid,'Dill pickles',8,'piece','fridge',3),
    (rid,'Iceberg lettuce',4,'piece','fridge',4),(rid,'Tomato',1,'qty','fridge',5),
    (rid,'Mayonnaise',3,'tbsp','fridge',6),(rid,'Ketchup',2,'tbsp','pantry',7),
    (rid,'Yellow mustard',1,'tbsp','fridge',8);
  INSERT INTO recipe_steps (recipe_id,instruction,step_order) VALUES
    (rid,'Mix mayo, ketchup, mustard for special sauce. Toast bun cut-sides in pan.',0),
    (rid,'Divide beef into 4 balls. Heat cast iron until smoking.',1),
    (rid,'Place balls on pan, smash flat with spatula. Season. Cook 2 min until edges brown.',2),
    (rid,'Flip, add cheese immediately. Cook 1 more min.',3),
    (rid,'Assemble: sauce on bun → lettuce → tomato → patty → pickles → more sauce.',4);
END IF;

SELECT id INTO rid FROM recipes WHERE title = 'BBQ Pulled Pork' AND is_global = true;
IF rid IS NULL THEN
  INSERT INTO recipes (title,description,cuisine,carb_type,protein_type,prep_time_min,cook_time_min,servings,emoji,bg_color,advance_prep_days,advance_prep_note,is_global,household_id,created_by)
  VALUES ('BBQ Pulled Pork','Slow-roasted pork shoulder, pulled and tossed in smoky BBQ sauce. Perfect in brioche buns.','american','bread','pork',20,300,8,'🥩','#7c2d12',1,'Best to dry rub the pork overnight in the fridge.',true,null,null)
  RETURNING id INTO rid;
  INSERT INTO recipe_ingredients (recipe_id,name,amount,unit,storage_location,sort_order) VALUES
    (rid,'Pork shoulder',2000,'g','fridge',0),(rid,'Smoked paprika',2,'tbsp','pantry',1),
    (rid,'Brown sugar',2,'tbsp','pantry',2),(rid,'Garlic powder',1,'tbsp','pantry',3),
    (rid,'BBQ sauce',250,'ml','pantry',4),(rid,'Brioche buns',8,'qty','pantry',5),
    (rid,'Apple cider vinegar',2,'tbsp','pantry',6),(rid,'Coleslaw',300,'g','fridge',7);
  INSERT INTO recipe_steps (recipe_id,instruction,step_order) VALUES
    (rid,'Mix paprika, sugar, garlic powder, salt. Rub all over pork. Refrigerate overnight.',0),
    (rid,'Preheat oven to 150°C. Roast pork in a covered dish 4–5 hrs until falling apart.',1),
    (rid,'Shred pork with two forks. Discard excess fat.',2),
    (rid,'Toss pulled pork with BBQ sauce and splash of apple cider vinegar.',3),
    (rid,'Pile high on brioche buns with coleslaw.',4);
END IF;

SELECT id INTO rid FROM recipes WHERE title = 'Mac & Cheese' AND is_global = true;
IF rid IS NULL THEN
  INSERT INTO recipes (title,description,cuisine,carb_type,protein_type,prep_time_min,cook_time_min,servings,emoji,bg_color,advance_prep_days,advance_prep_note,is_global,household_id,created_by)
  VALUES ('Mac & Cheese','Ultra-creamy stovetop mac with a three-cheese sauce and crunchy breadcrumb topping.','american','pasta','none',10,25,4,'🧀','#f59e0b',0,null,true,null,null)
  RETURNING id INTO rid;
  INSERT INTO recipe_ingredients (recipe_id,name,amount,unit,storage_location,sort_order) VALUES
    (rid,'Macaroni',350,'g','pantry',0),(rid,'Mature cheddar, grated',200,'g','fridge',1),
    (rid,'Gruyère, grated',100,'g','fridge',2),(rid,'Parmesan, grated',50,'g','fridge',3),
    (rid,'Whole milk',500,'ml','fridge',4),(rid,'Butter',40,'g','fridge',5),
    (rid,'Plain flour',30,'g','pantry',6),(rid,'Panko breadcrumbs',60,'g','pantry',7),
    (rid,'Mustard powder',1,'tsp','pantry',8);
  INSERT INTO recipe_steps (recipe_id,instruction,step_order) VALUES
    (rid,'Cook macaroni until al dente. Drain, reserving 100 ml pasta water.',0),
    (rid,'Make roux: melt butter, whisk in flour, cook 2 min. Gradually add milk, whisking until smooth.',1),
    (rid,'Add mustard powder. Off heat, stir in cheddar and gruyère until melted. Season.',2),
    (rid,'Combine pasta with sauce, loosen with pasta water if needed.',3),
    (rid,'Top with panko + Parmesan, grill 3–4 min until golden. Serve immediately.',4);
END IF;

-- ── MEDITERRANEAN ──────────────────────────────────────────────────────────

SELECT id INTO rid FROM recipes WHERE title = 'Greek Salad Bowl' AND is_global = true;
IF rid IS NULL THEN
  INSERT INTO recipes (title,description,cuisine,carb_type,protein_type,prep_time_min,cook_time_min,servings,emoji,bg_color,advance_prep_days,advance_prep_note,is_global,household_id,created_by)
  VALUES ('Greek Salad Bowl','Crispy falafel over a bed of hummus, tabbouleh, cucumber, and tomato with tahini dressing.','mediterranean','other','none',25,20,4,'🥗','#15803d',0,null,true,null,null)
  RETURNING id INTO rid;
  INSERT INTO recipe_ingredients (recipe_id,name,amount,unit,storage_location,sort_order) VALUES
    (rid,'Chickpeas (canned, drained)',400,'g','pantry',0),(rid,'Feta cheese',200,'g','fridge',1),
    (rid,'Cucumber',1,'qty','fridge',2),(rid,'Tomatoes',3,'qty','fridge',3),
    (rid,'Kalamata olives',100,'g','pantry',4),(rid,'Red onion',0.5,'qty','pantry',5),
    (rid,'Olive oil',4,'tbsp','pantry',6),(rid,'Lemon juice',2,'tbsp','pantry',7),
    (rid,'Dried oregano',1,'tsp','pantry',8),(rid,'Pita bread',4,'piece','pantry',9);
  INSERT INTO recipe_steps (recipe_id,instruction,step_order) VALUES
    (rid,'Chop cucumber, tomatoes, and onion into large chunks.',0),
    (rid,'Combine vegetables with olives and chickpeas in a large bowl.',1),
    (rid,'Whisk olive oil, lemon juice, oregano, salt, pepper. Toss with salad.',2),
    (rid,'Top with crumbled feta. Do not toss again — leave feta on top.',3),
    (rid,'Serve with warm pita bread.',4);
END IF;

SELECT id INTO rid FROM recipes WHERE title = 'Shakshuka' AND is_global = true;
IF rid IS NULL THEN
  INSERT INTO recipes (title,description,cuisine,carb_type,protein_type,prep_time_min,cook_time_min,servings,emoji,bg_color,advance_prep_days,advance_prep_note,is_global,household_id,created_by)
  VALUES ('Shakshuka','Eggs poached in a spiced tomato and pepper sauce. Quick, satisfying, and endlessly customisable.','mediterranean','bread','eggs',10,25,4,'🍳','#dc2626',0,null,true,null,null)
  RETURNING id INTO rid;
  INSERT INTO recipe_ingredients (recipe_id,name,amount,unit,storage_location,sort_order) VALUES
    (rid,'Eggs',6,'qty','fridge',0),(rid,'Tinned chopped tomatoes',800,'g','pantry',1),
    (rid,'Red peppers',2,'qty','fridge',2),(rid,'Onion',1,'qty','pantry',3),
    (rid,'Garlic cloves',3,'qty','pantry',4),(rid,'Cumin',1,'tsp','pantry',5),
    (rid,'Smoked paprika',1,'tsp','pantry',6),(rid,'Harissa',1,'tbsp','fridge',7),
    (rid,'Crusty bread',4,'piece','pantry',8);
  INSERT INTO recipe_steps (recipe_id,instruction,step_order) VALUES
    (rid,'Sauté onion and peppers in olive oil until soft, 8 min. Add garlic, cumin, paprika, harissa.',0),
    (rid,'Add tomatoes. Season. Simmer 15 min until sauce is thick.',1),
    (rid,'Make wells in sauce. Crack eggs in. Cover and cook on low until whites set, yolks runny, ~8 min.',2),
    (rid,'Scatter crumbled feta and parsley. Serve straight from pan with crusty bread.',3);
END IF;

SELECT id INTO rid FROM recipes WHERE title = 'Lamb Kofta Wraps' AND is_global = true;
IF rid IS NULL THEN
  INSERT INTO recipes (title,description,cuisine,carb_type,protein_type,prep_time_min,cook_time_min,servings,emoji,bg_color,advance_prep_days,advance_prep_note,is_global,household_id,created_by)
  VALUES ('Lamb Kofta Wraps','Spiced minced lamb kofta in flatbreads with tzatziki, tomato, and pickled chilli.','mediterranean','bread','lamb',25,15,4,'🥙','#92400e',0,null,true,null,null)
  RETURNING id INTO rid;
  INSERT INTO recipe_ingredients (recipe_id,name,amount,unit,storage_location,sort_order) VALUES
    (rid,'Minced lamb',500,'g','fridge',0),(rid,'Flatbreads',4,'piece','pantry',1),
    (rid,'Greek yoghurt',200,'ml','fridge',2),(rid,'Cucumber',0.5,'qty','fridge',3),
    (rid,'Garlic clove, minced',1,'qty','pantry',4),(rid,'Cumin',1,'tsp','pantry',5),
    (rid,'Coriander',1,'tsp','pantry',6),(rid,'Cinnamon',0.5,'tsp','pantry',7),
    (rid,'Tomatoes',2,'qty','fridge',8);
  INSERT INTO recipe_steps (recipe_id,instruction,step_order) VALUES
    (rid,'Mix lamb with cumin, coriander, cinnamon, salt, and half the garlic. Shape into 12 oval koftas.',0),
    (rid,'Grate cucumber, salt, squeeze dry. Mix with yoghurt and remaining garlic for tzatziki.',1),
    (rid,'Grill or pan-fry koftas 3–4 min per side until charred and cooked through.',2),
    (rid,'Warm flatbreads. Spread tzatziki, add sliced tomatoes, koftas.',3),
    (rid,'Roll tightly and serve immediately.',4);
END IF;

-- ── THAI ───────────────────────────────────────────────────────────────────

SELECT id INTO rid FROM recipes WHERE title = 'Pad Thai' AND is_global = true;
IF rid IS NULL THEN
  INSERT INTO recipes (title,description,cuisine,carb_type,protein_type,prep_time_min,cook_time_min,servings,emoji,bg_color,advance_prep_days,advance_prep_note,is_global,household_id,created_by)
  VALUES ('Pad Thai','Stir-fried rice noodles with prawns, egg, bean sprouts, and tamarind sauce.','thai','noodles','shrimp',20,15,4,'🍜','#f97316',0,null,true,null,null)
  RETURNING id INTO rid;
  INSERT INTO recipe_ingredients (recipe_id,name,amount,unit,storage_location,sort_order) VALUES
    (rid,'Flat rice noodles',250,'g','pantry',0),(rid,'Raw prawns, peeled',400,'g','freezer',1),
    (rid,'Eggs',3,'qty','fridge',2),(rid,'Bean sprouts',150,'g','fridge',3),
    (rid,'Tamarind paste',3,'tbsp','pantry',4),(rid,'Fish sauce',2,'tbsp','pantry',5),
    (rid,'Palm sugar',1,'tbsp','pantry',6),(rid,'Spring onions',3,'qty','fridge',7),
    (rid,'Crushed peanuts',60,'g','pantry',8),(rid,'Lime',2,'qty','pantry',9);
  INSERT INTO recipe_steps (recipe_id,instruction,step_order) VALUES
    (rid,'Soak noodles in cold water 30 min until pliable, drain.',0),
    (rid,'Mix tamarind, fish sauce, sugar for the sauce.',1),
    (rid,'Stir-fry prawns in very hot wok until pink. Push aside, scramble eggs in same wok.',2),
    (rid,'Add noodles and sauce. Toss vigorously 2–3 min until noodles absorb sauce.',3),
    (rid,'Add bean sprouts and spring onions. Toss once more.',4),
    (rid,'Serve with crushed peanuts, lime wedges, and extra chilli on the side.',5);
END IF;

SELECT id INTO rid FROM recipes WHERE title = 'Thai Green Curry' AND is_global = true;
IF rid IS NULL THEN
  INSERT INTO recipes (title,description,cuisine,carb_type,protein_type,prep_time_min,cook_time_min,servings,emoji,bg_color,advance_prep_days,advance_prep_note,is_global,household_id,created_by)
  VALUES ('Thai Green Curry','Creamy coconut milk curry with chicken, Thai basil, and fragrant green curry paste.','thai','rice','chicken',15,25,4,'🍛','#16a34a',0,null,true,null,null)
  RETURNING id INTO rid;
  INSERT INTO recipe_ingredients (recipe_id,name,amount,unit,storage_location,sort_order) VALUES
    (rid,'Chicken breast, sliced',600,'g','fridge',0),(rid,'Coconut milk',400,'ml','pantry',1),
    (rid,'Green curry paste',3,'tbsp','pantry',2),(rid,'Thai basil',20,'g','fridge',3),
    (rid,'Fish sauce',2,'tbsp','pantry',4),(rid,'Palm sugar',1,'tbsp','pantry',5),
    (rid,'Aubergine',1,'qty','fridge',6),(rid,'Kaffir lime leaves',4,'qty','pantry',7),
    (rid,'Jasmine rice',320,'g','pantry',8);
  INSERT INTO recipe_steps (recipe_id,instruction,step_order) VALUES
    (rid,'Fry curry paste in a dry wok 1 min. Add half the coconut milk, stir until split and fragrant.',0),
    (rid,'Add chicken, stir to coat. Cook 5 min.',1),
    (rid,'Add remaining coconut milk, lime leaves, fish sauce, sugar, and aubergine.',2),
    (rid,'Simmer 15 min until chicken is cooked and aubergine is tender.',3),
    (rid,'Stir in Thai basil off heat. Serve over jasmine rice.',4);
END IF;

SELECT id INTO rid FROM recipes WHERE title = 'Tom Yum Soup' AND is_global = true;
IF rid IS NULL THEN
  INSERT INTO recipes (title,description,cuisine,carb_type,protein_type,prep_time_min,cook_time_min,servings,emoji,bg_color,advance_prep_days,advance_prep_note,is_global,household_id,created_by)
  VALUES ('Tom Yum Soup','Hot and sour Thai broth with prawns, mushrooms, lemongrass, and kaffir lime.','thai','none','shrimp',15,15,4,'🥘','#dc2626',0,null,true,null,null)
  RETURNING id INTO rid;
  INSERT INTO recipe_ingredients (recipe_id,name,amount,unit,storage_location,sort_order) VALUES
    (rid,'Raw prawns',400,'g','freezer',0),(rid,'Mushrooms, sliced',200,'g','fridge',1),
    (rid,'Lemongrass stalks',2,'qty','pantry',2),(rid,'Kaffir lime leaves',6,'qty','pantry',3),
    (rid,'Galangal or ginger, sliced',4,'piece','pantry',4),(rid,'Tom yum paste',2,'tbsp','pantry',5),
    (rid,'Fish sauce',2,'tbsp','pantry',6),(rid,'Lime juice',3,'tbsp','pantry',7),
    (rid,'Red chillies',2,'qty','fridge',8),(rid,'Coriander',20,'g','fridge',9);
  INSERT INTO recipe_steps (recipe_id,instruction,step_order) VALUES
    (rid,'Bring 1 L water to boil with bruised lemongrass, kaffir lime leaves, and galangal.',0),
    (rid,'Stir in tom yum paste. Simmer 5 min.',1),
    (rid,'Add mushrooms and prawns. Cook 3–4 min until prawns are pink.',2),
    (rid,'Season with fish sauce and lime juice. Taste — should be hot, sour, salty.',3),
    (rid,'Ladle into bowls with chillies and coriander.',4);
END IF;

-- ── FRENCH ─────────────────────────────────────────────────────────────────

SELECT id INTO rid FROM recipes WHERE title = 'Quiche Lorraine' AND is_global = true;
IF rid IS NULL THEN
  INSERT INTO recipes (title,description,cuisine,carb_type,protein_type,prep_time_min,cook_time_min,servings,emoji,bg_color,advance_prep_days,advance_prep_note,is_global,household_id,created_by)
  VALUES ('Quiche Lorraine','Classic French tart with a buttery pastry crust, lardons, and a silky egg custard.','french','other','pork',30,45,6,'🥧','#f59e0b',0,null,true,null,null)
  RETURNING id INTO rid;
  INSERT INTO recipe_ingredients (recipe_id,name,amount,unit,storage_location,sort_order) VALUES
    (rid,'Shortcrust pastry sheet',1,'piece','fridge',0),(rid,'Lardons or smoked bacon',200,'g','fridge',1),
    (rid,'Eggs',3,'qty','fridge',2),(rid,'Double cream',300,'ml','fridge',3),
    (rid,'Gruyère cheese, grated',100,'g','fridge',4),(rid,'Nutmeg',0.25,'tsp','pantry',5);
  INSERT INTO recipe_steps (recipe_id,instruction,step_order) VALUES
    (rid,'Preheat oven to 190°C. Line a 23 cm tart tin with pastry. Blind bake 15 min.',0),
    (rid,'Fry lardons until golden. Scatter over pastry base with half the cheese.',1),
    (rid,'Whisk eggs with cream, nutmeg, salt, and pepper.',2),
    (rid,'Pour custard over lardons. Top with remaining cheese.',3),
    (rid,'Bake 30–35 min until just set with a slight wobble. Cool 10 min before slicing.',4);
END IF;

SELECT id INTO rid FROM recipes WHERE title = 'Ratatouille' AND is_global = true;
IF rid IS NULL THEN
  INSERT INTO recipes (title,description,cuisine,carb_type,protein_type,prep_time_min,cook_time_min,servings,emoji,bg_color,advance_prep_days,advance_prep_note,is_global,household_id,created_by)
  VALUES ('Ratatouille','Provençal slow-cooked vegetable stew with aubergine, courgette, tomatoes, and herbes de Provence.','french','none','none',20,60,6,'🫕','#dc2626',0,null,true,null,null)
  RETURNING id INTO rid;
  INSERT INTO recipe_ingredients (recipe_id,name,amount,unit,storage_location,sort_order) VALUES
    (rid,'Aubergine, cubed',2,'qty','fridge',0),(rid,'Courgette, cubed',2,'qty','fridge',1),
    (rid,'Red peppers',2,'qty','fridge',2),(rid,'Tomatoes, chopped',4,'qty','fridge',3),
    (rid,'Onion',1,'qty','pantry',4),(rid,'Garlic cloves',3,'qty','pantry',5),
    (rid,'Olive oil',5,'tbsp','pantry',6),(rid,'Herbes de Provence',1,'tbsp','pantry',7),
    (rid,'Tomato purée',2,'tbsp','pantry',8);
  INSERT INTO recipe_steps (recipe_id,instruction,step_order) VALUES
    (rid,'Salt aubergine and courgette cubes 20 min to draw moisture. Pat dry.',0),
    (rid,'Brown aubergine and courgette separately in batches in olive oil. Set aside.',1),
    (rid,'Soften onion and peppers in same pan 8 min. Add garlic and tomato purée.',2),
    (rid,'Return all vegetables to pan. Add tomatoes and herbes de Provence.',3),
    (rid,'Cover and simmer 40 min on low, stirring occasionally. Season. Serve warm or at room temperature.',4);
END IF;

-- ── MIDDLE EASTERN ─────────────────────────────────────────────────────────

SELECT id INTO rid FROM recipes WHERE title = 'Chicken Shawarma' AND is_global = true;
IF rid IS NULL THEN
  INSERT INTO recipes (title,description,cuisine,carb_type,protein_type,prep_time_min,cook_time_min,servings,emoji,bg_color,advance_prep_days,advance_prep_note,is_global,household_id,created_by)
  VALUES ('Chicken Shawarma','Marinated chicken thighs with warm Middle Eastern spices, served in flatbread with garlic sauce.','middle-eastern','bread','chicken',20,20,4,'🥙','#d97706',0,null,true,null,null)
  RETURNING id INTO rid;
  INSERT INTO recipe_ingredients (recipe_id,name,amount,unit,storage_location,sort_order) VALUES
    (rid,'Chicken thighs',700,'g','fridge',0),(rid,'Flatbreads',4,'piece','pantry',1),
    (rid,'Yoghurt',150,'ml','fridge',2),(rid,'Garlic cloves',4,'qty','pantry',3),
    (rid,'Lemon juice',3,'tbsp','pantry',4),(rid,'Cumin',1.5,'tsp','pantry',5),
    (rid,'Allspice',1,'tsp','pantry',6),(rid,'Turmeric',0.5,'tsp','pantry',7),
    (rid,'Tomatoes',2,'qty','fridge',8);
  INSERT INTO recipe_steps (recipe_id,instruction,step_order) VALUES
    (rid,'Marinate chicken in yoghurt, 2 garlic cloves, lemon, cumin, allspice, turmeric at least 1 hr.',0),
    (rid,'Make garlic sauce: blend remaining garlic with olive oil, lemon juice until thick.',1),
    (rid,'Grill or oven-roast chicken at 220°C for 15–20 min until charred at edges.',2),
    (rid,'Rest 5 min, slice thinly.',3),
    (rid,'Spread garlic sauce on warm flatbread, top with chicken and tomato.',4);
END IF;

SELECT id INTO rid FROM recipes WHERE title = 'Beef & Lamb Kebabs' AND is_global = true;
IF rid IS NULL THEN
  INSERT INTO recipes (title,description,cuisine,carb_type,protein_type,prep_time_min,cook_time_min,servings,emoji,bg_color,advance_prep_days,advance_prep_note,is_global,household_id,created_by)
  VALUES ('Beef & Lamb Kebabs','Minced beef and lamb kebabs spiced with parsley, onion, and sumac. Serve with flatbread and yoghurt.','middle-eastern','bread','beef',20,15,4,'🍖','#b45309',0,null,true,null,null)
  RETURNING id INTO rid;
  INSERT INTO recipe_ingredients (recipe_id,name,amount,unit,storage_location,sort_order) VALUES
    (rid,'Minced beef',300,'g','fridge',0),(rid,'Minced lamb',200,'g','fridge',1),
    (rid,'Onion, grated',1,'qty','pantry',2),(rid,'Parsley, finely chopped',30,'g','fridge',3),
    (rid,'Sumac',1,'tsp','pantry',4),(rid,'Cumin',1,'tsp','pantry',5),
    (rid,'Flatbreads',4,'piece','pantry',6),(rid,'Greek yoghurt',200,'ml','fridge',7);
  INSERT INTO recipe_steps (recipe_id,instruction,step_order) VALUES
    (rid,'Combine meats, grated onion, parsley, sumac, cumin, salt. Mix well.',0),
    (rid,'Shape onto skewers as elongated sausages. Chill 30 min if time allows.',1),
    (rid,'Grill over high heat turning regularly, 10–12 min until charred.',2),
    (rid,'Serve on warm flatbreads with yoghurt and a squeeze of lemon.',3);
END IF;

-- ── KOREAN ─────────────────────────────────────────────────────────────────

SELECT id INTO rid FROM recipes WHERE title = 'Bibimbap' AND is_global = true;
IF rid IS NULL THEN
  INSERT INTO recipes (title,description,cuisine,carb_type,protein_type,prep_time_min,cook_time_min,servings,emoji,bg_color,advance_prep_days,advance_prep_note,is_global,household_id,created_by)
  VALUES ('Bibimbap','Korean mixed rice bowl with marinated beef, assorted vegetables, fried egg, and gochujang sauce.','korean','rice','beef',30,20,4,'🍚','#dc2626',0,null,true,null,null)
  RETURNING id INTO rid;
  INSERT INTO recipe_ingredients (recipe_id,name,amount,unit,storage_location,sort_order) VALUES
    (rid,'Short grain rice',400,'g','pantry',0),(rid,'Beef sirloin, thinly sliced',300,'g','fridge',1),
    (rid,'Eggs',4,'qty','fridge',2),(rid,'Spinach',200,'g','fridge',3),
    (rid,'Carrots',2,'qty','fridge',4),(rid,'Courgette',1,'qty','fridge',5),
    (rid,'Bean sprouts',100,'g','fridge',6),(rid,'Soy sauce',3,'tbsp','pantry',7),
    (rid,'Sesame oil',2,'tbsp','pantry',8),(rid,'Gochujang',4,'tbsp','fridge',9),
    (rid,'Sugar',1,'tbsp','pantry',10),(rid,'Garlic cloves',2,'qty','pantry',11);
  INSERT INTO recipe_steps (recipe_id,instruction,step_order) VALUES
    (rid,'Marinate beef in soy sauce, 1 tsp sesame oil, garlic, sugar for 15 min. Stir-fry until cooked.',0),
    (rid,'Blanch spinach and bean sprouts separately 1 min. Squeeze dry, season with sesame oil and salt.',1),
    (rid,'Sauté julienned carrots and courgette separately until just tender.',2),
    (rid,'Mix gochujang sauce: gochujang + sugar + sesame oil + 1 tbsp water.',3),
    (rid,'Divide rice into 4 bowls. Arrange vegetables and beef in sections on top. Add fried egg in centre.',4),
    (rid,'Drizzle gochujang sauce over. Mix everything together at the table before eating.',5);
END IF;

END;
$$;

SELECT COUNT(*) AS global_recipes_inserted FROM recipes WHERE is_global = true;
