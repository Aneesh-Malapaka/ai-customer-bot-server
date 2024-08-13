const express = require("express");
const {
  fetchCategoriesAndStore,
  fetchCategorySpecificFoods,
  fetchLocationSpecificFoods,
} = require("./fetchingData");
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
const category = "SeaFood";
fetchCategorySpecificFoods(category)
  .then(() => {
    console.log("Meals fetched and stored successfully.");
  })
  .catch((error) => {
    console.error("Failed to fetch categories:", error);
  });

const location = "Russian";
fetchLocationSpecificFoods(location)
  .then(() => {
    console.log("Meals fetched from Location and stored successfully.");
  })
  .catch((error) => {
    console.error("Failed to fetch location meals:", error);
  });

//using middleware ejs for the views
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

app.get("/", (req, res) => {
  res.send("Server is up and running")
});

app.post("/", async (req, res) => {
  const userQuery = req.body.user_input;
  console.log("user query is ", userQuery, " ", req.body);
  try {
    const categorize = categorizeDBGemini();
    // console.log(categorize)
    const categoryResult = await categorize(userQuery);
    console.log(categoryResult.trim().replace(/"/g , ''), typeof(categoryResult), "Hi");

    let finalResult;
    if (categoryResult.trim().replace(/"/g , '') === "list_categories") {
      try {
        const categories = await retrieveCategories();

        // Create final data to pass to the AI
        const finalData = {
          query: userQuery,
          data: categories,
        };

        const ai_response = responsesGemini();
        finalResult = await ai_response(finalData);
        console.log(finalResult)
      } catch (error) {
        console.log("Error while processing list_categories:", error);
        res
          .status(500)
          .json({ message: "An error occurred. Please try again later." });
      }
    } else if (categoryResult.trim().replace(/"/g , '') === "category") {
      try {
        const mealsFetched = await retrieveMealsFromCategory();

        const final_data = {
          query: userQuery,
          data: mealsFetched,
        };

        const ai_response = responsesGemini();
        finalResult = await ai_response(final_data);
      } catch (error) {
        console.log("Error while processing meals:", error);
        res
          .status(500)
          .json({ message: "An error occurred. Please try again later." });
      }
    } else if (categoryResult.trim().replace(/"/g , '') === "country_cuisine") {
      try {
        const mealsFetched = await retrieveMealsFromLocation();
        console.log(mealsFetched)
        const final_data = {
          query: userQuery,
          data: mealsFetched,
        };

        const ai_response = responsesGemini();
        finalResult = await ai_response(final_data);
      } catch (error) {
        console.log("Error while processing meals:", error);
        res
          .status(500)
          .json({ message: "An error occurred. Please try again later." });
      }
    } else {
      finalResult = categoryResult
    }

    let jsonResponse;
    try {
      jsonResponse = JSON.parse(finalResult);
      console.log(jsonResponse)
    } catch (error) {
      jsonResponse = { message: finalResult };
    }

    res.status(200).json(jsonResponse);
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

async function retrieveMealsFromLocation() {
  try {
    const mealsSnapshot = await db.collection("location_meals").get();

    if (!mealsSnapshot.empty) {
      const meals = [];
      mealsSnapshot.forEach((doc) => {
        meals.push({
          location: doc.data().location,
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
