class APIfeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    //1A) Filtering
    let queryObj = { ...this.queryString };
    const excludedFields = ['page', 'limit', 'sort', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    //1B) Advanced Filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, el => `$${el}`);
    queryObj = JSON.parse(queryStr);

    this.query.find(queryObj);
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortString = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortString);
    } else {
      this.query = this.query.sort('-createdAt'); //default sort by date
    }
    return this;
  }

  fieldLimit() {
    if (this.queryString.fields) {
      const fieldsString = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fieldsString);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1; // '*'to convert string to number
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIfeatures;
