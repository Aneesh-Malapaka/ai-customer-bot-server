const express = require("express");
const {fetchCategoriesAndStore, fetchCategorySpecificFoods} = require("./fetchingData");
const { categorizeDBGemini, responsesGemini } = require("./geminiMethods");
const db = require("./service");
const cors = require("cors");
const app = express();

//calling the categories fetching function only once on server start
fetchCategoriesAndStore()
  .then(() => {
    console.log("Categories fetched and stored successfully.");
  })
  .catch((error) => {
    console.error("Failed to fetch categories:", error);
  });
const category = "Dessert";
fetchCategorySpecificFoods(category)
  .then(() => {
    console.log("Meals fetched and stored successfully.");
  })
  .catch((error) => {
    console.error("Failed to fetch categories:", error);
  });

//using middleware ejs for the views
app.use(express.json());
app.engine("html", require("ejs").renderFile);
app.use(express.static("public")); //for styles
app.use(cors({
    origin: 'http://localhost:3000', 
}));

app.get("/", (req, res) => {
  res.render("index.html");
});

app.post("/", async (req, res) => {
  const userQuery = req.body.user_input;
  console.log("user query is ", userQuery, " ", req.body);
  try {
    const categorize = categorizeDBGemini();
    // console.log(categorize)
    const categoryResult = await categorize(userQuery);
   
    if (categoryResult.trim() === "list_categories") {
        try {
            const categories = await retrieveCategories();
            
            // Create final data to pass to the AI
            const finalData = {
                query: userQuery,
                data: categories,
            };
            
            
            const ai_response = responsesGemini();
            const finalResult = await ai_response(finalData);
            
            
            res.status(200).json({
                message: finalResult,
            });
        } catch (error) {
            console.log("Error while processing list_categories:", error);
            res.status(500).json({ message: "An error occurred. Please try again later." });
        }
    } 
    else if(categoryResult.trim() === "category"){
        try{
            const mealsFetched = await retrieveMealsFromCategory();

            const final_data = {
                query: userQuery,
                data: mealsFetched,
            };

            const ai_response = responsesGemini();
            const final_result = await ai_response(final_data);
            
            res.status(200).json({
                message: final_result,
            });
        }catch(error){
            console.log("Error while processing meals:", error);
            res.status(500).json({ message: "An error occurred. Please try again later." });
        }
    }else {
      res.status(200).json({
        message: categoryResult,
      });
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "An error occurred. Please try again later." });
  }
});

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});

async function retrieveCategories() {
  try {
    const categorySnapshot = await db.collection("categories").get(); 

    if (!categorySnapshot.empty) {
      const categories = [];
      categorySnapshot.forEach((doc) => {
        categories.push(doc.data().strCategory); 
      });
      return categories; 
    } else {
      console.log("No categories found in the database.");
    }
  } catch (error) {
    console.error("Error fetching categories:", error);
  }
}

async function retrieveMealsFromCategory() {
  try {
    const mealsSnapshot = await db.collection("meals").get();

    if (!mealsSnapshot.empty) {
      const meals = [];
      mealsSnapshot.forEach((doc) => {
        meals.push({
            category: doc.data().category,
            name: doc.data().strMeal,
        }); 
      });
      
      return meals; 
    } else {
      console.log("No meals found in the database.");
    }
  } catch (error) {
    console.error("Error fetching meals:", error);
  }
}
