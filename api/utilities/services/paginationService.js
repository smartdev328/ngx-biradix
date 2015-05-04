module.exports = {
    getPager:function(skip,limit,total) {
        return {count: total, itemsPerPage: limit, offset: skip, currentPage: skip / limit + 1}
    }
}