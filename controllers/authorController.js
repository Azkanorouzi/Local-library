const { body, validationResult } = require("express-validator");
const Book = require("../models/book");
const Author = require("../models/author");
const asyncHandler = require("express-async-handler");
const debug = require("debug")("author");

// Display list of all Authors
exports.author_list = asyncHandler(async (req, res, next) => {
  const allAuthors = await Author.find().sort({ family_name: 1 }).exec();
  res.render("author_list", {
    title: "Author list",
    author_list: allAuthors,
  });
});

exports.author_detail = asyncHandler(async (req, res, next) => {
  const [author, allBooksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }, "title summary").exec(),
  ]);

  if (author === null) {
    debug(`Id not found on finding author: ${req.params.id}`);
    const err = new Error("Author not found");
    err.status = 404;
    return next(err);
  }

  res.render("author_detail", {
    title: "Author Detail",
    author: author,
    author_books: allBooksByAuthor,
  });
});

exports.author_create_get = asyncHandler(async (req, res, next) => {
  res.render("author_form", { title: "Create Author" });
});

exports.author_create_post = [
  body("first_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("First name msut be specified")
    .isAlphanumeric()
    .withMessage("First name as non-alphanaumeric characters"),
  body("family_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("Family name must be specified")
    .isAlphanumeric()
    .withMessage("Family name has non-alphanaumeric characters."),
  body("date_of_birth", "invalid date of birth")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),
  body("date_of_death", "Invalid date of death")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
    });

    if (!errors.isEmpty()) {
      res.render("author_form", {
        title: "Create author",
        author,
        errors: errors.array(),
      });
      return;
    } else {
      await author.save();
      res.redirect(author.url);
    }
  }),
];
// to get the delete page
exports.author_delete_get = asyncHandler(async (req, res, next) => {
  // we must find the author, and the books that it published so that we can delete them
  // if findById() returns no results the author is not in the database, in that case there's basically nothing to delete, so we immediately redirect to the list of all authors
  const [author, allBooksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }, "Title summary").exec(),
  ]);

  if (author === null) {
    const err = new Error("Delete page for author not found");
    err.status = 404;
    return next(err);
  }

  res.render("author_delete", {
    title: "Delete Author",
    author,
    author_books: allBooksByAuthor,
  });
});

// to delete an author
exports.author_delete_post = asyncHandler(async (req, res, next) => {
  // Get details of authors and all their books in parallel
  const [author, allBooksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }, "title summary").exec(),
  ]);

  // If there're no books we just redirect the user
  if (allBooksByAuthor.length > 0) {
    // author has books. render as same way as for GET route
    res.render("author_delete", {
      title: "Delete author",
      author,
      author_books: allBooksByAuthor,
    });

    return;
  } else {
    // Author has no books, delete object and redirect to the list of authors
    await Author.findByIdAndDelete(req.body.authorid);
    res.redirect("/catalog/authors");
  }
});

exports.author_update_get = asyncHandler(async (req, res, next) => {
  const author = await Author.findById(req.params.id);
  if (!author) {
    const err = new Error("Author not found");
    err.status(404);
    return next(err);
  }
  res.render("author_form", { title: "Author update", author });
});

exports.author_update_post = [
  body("first_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("First name msut be specified")
    .isAlphanumeric()
    .withMessage("First name as non-alphanaumeric characters"),
  body("family_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("Family name must be specified")
    .isAlphanumeric()
    .withMessage("Family name has non-alphanaumeric characters."),
  body("date_of_birth", "invalid date of birth")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),
  body("date_of_death", "Invalid date of death")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),
  asyncHandler(async function (req, res, next) {
    const errors = validationResult(req);
    const author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_death: req.body.date_of_death,
      date_of_birth: req.body.date_of_birth,
      _id: req.params.id, // This is required, or a new ID will be assigned!
    });

    if (!errors.isEmpty()) {
      res.render("author_form", {
        title: "Update author",
        author,
        errors: errors.array(),
      });
    } else {
      const updatedAuthor = await Author.findByIdAndUpdate(
        req.params.id,
        author,
        {},
      );
      res.redirect(updatedAuthor.url);
    }
  }),
];
