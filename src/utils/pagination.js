const pagination = async (model, query, options = {}) => {
  const {
    page = 1,
    limit = 10,
    sort = { createdAt: -1 },
    populate = null,
    select = null
  } = options;

  const skip = (page - 1) * limit;

  let queryBuilder = model.find(query);

  if (select) {
    queryBuilder = queryBuilder.select(select);
  }

  if (populate) {
    if (Array.isArray(populate)) {
      populate.forEach(pop => {
        queryBuilder = queryBuilder.populate(pop);
      });
    } else {
      queryBuilder = queryBuilder.populate(populate);
    }
  }

  const [data, total] = await Promise.all([
    queryBuilder.sort(sort).skip(skip).limit(limit),
    model.countDocuments(query)
  ]);

  const pages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages,
      hasNextPage: page < pages,
      hasPrevPage: page > 1,
      nextPage: page < pages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null
    }
  };
};

const createPaginationLinks = (baseUrl, page, pages, limit) => {
  const links = {
    self: `${baseUrl}?page=${page}&limit=${limit}`,
    first: `${baseUrl}?page=1&limit=${limit}`,
    last: `${baseUrl}?page=${pages}&limit=${limit}`
  };

  if (page > 1) {
    links.prev = `${baseUrl}?page=${page - 1}&limit=${limit}`;
  }

  if (page < pages) {
    links.next = `${baseUrl}?page=${page + 1}&limit=${limit}`;
  }

  return links;
};

const paginateAggregate = async (model, pipeline, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [data, totalResult] = await Promise.all([
    model.aggregate([...pipeline, { $skip: skip }, { $limit: limit }]),
    model.aggregate([...pipeline, { $count: 'total' }])
  ]);

  const total = totalResult[0] ? totalResult[0].total : 0;
  const pages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages
    }
  };
};

module.exports = {
  pagination,
  createPaginationLinks,
  paginateAggregate
};
