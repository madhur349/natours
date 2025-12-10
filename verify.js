const bcrypt = require("bcrypt");

const hash = "$2a$12$Q0grHjH9PXc6SxivC8m12.2mZJ9BbKcgFpwSG4Y1ZEII8HJVzWeyS";
const password = "test1234";

bcrypt.compare(password, hash, (err, result) => {
  if (err) {
    console.error("Error:", err);
  } else {
    console.log("Does it match?", result); // true or false
  }
});
