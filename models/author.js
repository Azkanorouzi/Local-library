const { DateTime } = require("luxon");
const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const AuthorSchema = new Schema({
  first_name: { type: String, required: true, maxLength: 100 },
  family_name: { type: String, required: true, maxLength: 100 },
  date_of_birth: { type: Date },
  date_of_death: { type: Date },
});

AuthorSchema.virtual("name").get(function () {
  let fullName = "";

  if (this.first_name && this.family_name) {
    fullName = `${this.family_name}, ${this.first_name}`;
  }

  return fullName;
});

AuthorSchema.virtual("birth_formatted").get(function () {
  if (!this?.date_of_birth) return "";
  return DateTime.fromJSDate(this.date_of_birth).toLocaleString(
    DateTime.DATE_MED,
  );
});

AuthorSchema.virtual("death_formatted").get(function () {
  if (!this?.date_of_death) return "";
  return DateTime.fromJSDate(this.date_of_death).toLocaleString(
    DateTime.DATE_MED,
  );
});

// Life span author model
AuthorSchema.virtual("lifespan").get(function () {
  const formattedDeath = DateTime.fromJSDate(this.date_of_death);
  const formattedBirth = DateTime.fromJSDate(this.date_of_birth);
  const lifespan = formattedDeath.diff(formattedBirth, [
    "years",
    "months",
    "days",
  ]);
  if (!lifespan?.years && !lifespan.months && !lifespan.days) return "Alive";
  const formattedDifference = `${lifespan?.years} years and ${lifespan.months} months and ${Math.floor(lifespan.days)} days from death `;

  return formattedDifference;
});

AuthorSchema.virtual("url").get(function () {
  return `/catalog/author/${this.id}`;
});

AuthorSchema.virtual("birth_yyyy_mm_dd").get(function () {
  return DateTime.fromJSDate(this.date_of_birth).toISODate();
});
AuthorSchema.virtual("death_yyyy_mm_dd").get(function () {
  return DateTime.fromJSDate(this.date_of_death).toISODate();
});

module.exports = mongoose.model("Author", AuthorSchema);
