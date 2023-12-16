/* eslint-disable no-undef */
class ApiFeatures {
  constructor(model, reqQuery) {
    this.model = model;
    this.reqQuery = reqQuery;
  }

  search() {
    const keyword = this.reqQuery.keyword
      ? {
          name: {
            $regex: this.reqQuery.keyword,
            $options: "i",
          },
        }
      : {};

    this.model = this.model.find({ ...keyword });
    // console.log({ ...keyword });
    return this;
  }
  filter() {
    const modelCopy = { ...this.reqQuery };

    // removing some fileds from model for the category--
    const removeFileds = ["keyword", "page", "limit"];
    removeFileds.forEach((key) => delete modelCopy[key]);
    // filter for price and rating--
    let reqQuery = JSON.stringify(modelCopy);
    reqQuery = reqQuery.replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`);

    this.model = this.model.find(JSON.parse(reqQuery));
    // this.model = this.model.find({ price: { $lte: 501 ,$gte:120} });
    return this;
  }
  pagination(resultPerpage) {
    const currentpage = Number(this.reqQuery.page) || 1;
    const skip = resultPerpage * (currentpage - 1);

    this.model = this.model.find().limit(resultPerpage).skip(skip);
    return this;
  }
}

module.exports = ApiFeatures;
