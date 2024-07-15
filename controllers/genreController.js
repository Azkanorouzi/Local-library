const { body, validationResult } = require("express-validator");
const Book = require("../models/book");
const Genre = require("../models/genre");
const asyncHandler = require("express-async-handler");

exports.genre_list = asyncHandler(async (req, res, next) => {
  const allGenres = await Genre.find().exec();
  res.render("genre_list", {
    title: "Genre page",
    genres: allGenres,
  });
});

exports.genre_detail = asyncHandler(async (req, res, next) => {
  const [genre, booksInGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }, "title summary").exec(),
  ]);

  // Since we're handling the error ourselves using a middleware all we have to do here is to just return a next(err) with an err

  if (genre === null) {
    const err = new Error("Genre not found");
    err.status(404);
    return next(err);
  }

  res.render("genre_detail", {
    title: "Genre Detail",
    genre,
    genre_books: booksInGenre,
  });
});

exports.genre_create_get = (req, res, next) => {
  res.render("genre_form", { title: "Create genre" });
};

exports.genre_create_post = [
  body("name", "Genre name must contain at least 3 characters")
    .trim()
    .isLength({ min: 3 }),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    // Create a new genre with escaped and trimmed  data
    const genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      // There're errors re render the form with errors
      res.render("genre_form", {
        title: "Create Genre",
        genre,
        errors: errors.array(),
      });
      return;
    } else {
      // Data form is valid
      // Check if a genre with the same name already exist
      const genreExists = await Genre.findOne({ name: req.body.name })
        .collation({ locale: "en", strength: 2 })
        .exec();
      if (genreExists) {
        // Genre exists redirect to the detail page
        res.redirect(genreExists.url);
      } else {
        await genre.save();

        // now genre is saved redirect to the detail page
        res.redirect(genre.url);
      }
    }
  }),
];

exports.genre_delete_get = asyncHandler(async (req, res, next) => {
  const [genre, booksByGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }).exec(),
  ]);

  if (!genre) {
    const err = new Error("Delete page for this genre was not found!");
    err.status = 404;
    next(err);
  }

  res.render("genre_delete", {
    title: "Delete genre",
    genre: genre,
    booksByGenre,
  });
});

exports.genre_delete_post = asyncHandler(async (req, res, next) => {
  const [genre, booksByGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }).exec(),
  ]);

  if (booksByGenre.length) {
    res.render("genre_delete", { title: "Delete genre", booksByGenre, genre });
  } else {
    await Genre.findByIdAndDelete(req.params.id);
    res.redirect("/catalog/genres");
  }
});

exports.genre_update_get = asyncHandler(async (req, res, next) => {
  const genre = await Genre.findById(req.params.id);

  if (!genre) {
    const err = new Error("Delete page for updating genre was not found!");
    err.status = 404;
    next(err);
  }

  res.render("genre_form", { genre });
});

exports.genre_update_post = [
  body("name", "Genre name must contain at least 3 characters")
    .trim()
    .isLength({ min: 3 }),
  asyncHandler(async function (req, res, next) {
    const errors = validationResult(req);
    const genre = new Genre({ name: req.body.name, _id: req.params.id });

    if (!errors.isEmpty()) {
      res.render("genre_form", { genre, errors });
    } else {
      const updatedGenre = await Genre.findByIdAndUpdate(req.params.id, genre);
      res.redirect(updatedGenre.url);
    }
  }),
];
