const db = require("./service");
const axios = require("axios");

async function fetchCategoriesAndStore() {
  try {
    const response = await axios.get(
      "https://www.themealdb.com/api/json/v1/1/categories.php"
    );
    // console.log(response.data);
    const categoriesList = response.data.categories;
    const filteredCategory = categoriesList.map((category) => {
      const { strCategoryDescription, ...filtered } = category;
      return filtered;
    });
    // console.log(filteredCategory)
    //uploading to firestore db
    const batch = db.batch();
    filteredCategory.forEach((category) => {
      const categoryRef = db.collection("categories").doc(category.idCategory);
      batch.set(categoryRef, category);
    });
    await batch.commit();
  } catch (error) {
    console.log(error);
  }
}

async function fetchCategorySpecificFoods(category){
  try{
    const response = await axios.get(
      `https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`
      // `https://www.themealdb.com/api/json/v1/1/filter.php?c=Vegetarian`
    )
    const foods = response.data.meals
    const filteredMeals = foods.map((food)=>{
     food.category = category
      const {strMealThumb, ...filteredMeal} = food
      return filteredMeal
    })
    const batch = db.batch()
    filteredMeals.slice(0,6).forEach((meal)=>{
      const mealRef = db.collection("meals").doc(meal.idMeal)
      batch.set(mealRef, meal)
    });
    await batch.commit()
  }catch (error) {
    console.log(error);
  }
}
module.exports = {
  fetchCategoriesAndStore,
  fetchCategorySpecificFoods
};
