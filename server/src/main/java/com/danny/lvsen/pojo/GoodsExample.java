package com.danny.lvsen.pojo;

import java.util.ArrayList;
import java.util.List;

public class GoodsExample {
    protected String orderByClause;

    protected boolean distinct;

    protected List<Criteria> oredCriteria;

    public GoodsExample() {
        oredCriteria = new ArrayList<Criteria>();
    }

    public void setOrderByClause(String orderByClause) {
        this.orderByClause = orderByClause;
    }

    public String getOrderByClause() {
        return orderByClause;
    }

    public void setDistinct(boolean distinct) {
        this.distinct = distinct;
    }

    public boolean isDistinct() {
        return distinct;
    }

    public List<Criteria> getOredCriteria() {
        return oredCriteria;
    }

    public void or(Criteria criteria) {
        oredCriteria.add(criteria);
    }

    public Criteria or() {
        Criteria criteria = createCriteriaInternal();
        oredCriteria.add(criteria);
        return criteria;
    }

    public Criteria createCriteria() {
        Criteria criteria = createCriteriaInternal();
        if (oredCriteria.size() == 0) {
            oredCriteria.add(criteria);
        }
        return criteria;
    }

    protected Criteria createCriteriaInternal() {
        Criteria criteria = new Criteria();
        return criteria;
    }

    public void clear() {
        oredCriteria.clear();
        orderByClause = null;
        distinct = false;
    }

    protected abstract static class GeneratedCriteria {
        protected List<Criterion> criteria;

        protected GeneratedCriteria() {
            super();
            criteria = new ArrayList<Criterion>();
        }

        public boolean isValid() {
            return criteria.size() > 0;
        }

        public List<Criterion> getAllCriteria() {
            return criteria;
        }

        public List<Criterion> getCriteria() {
            return criteria;
        }

        protected void addCriterion(String condition) {
            if (condition == null) {
                throw new RuntimeException("Value for condition cannot be null");
            }
            criteria.add(new Criterion(condition));
        }

        protected void addCriterion(String condition, Object value, String property) {
            if (value == null) {
                throw new RuntimeException("Value for " + property + " cannot be null");
            }
            criteria.add(new Criterion(condition, value));
        }

        protected void addCriterion(String condition, Object value1, Object value2, String property) {
            if (value1 == null || value2 == null) {
                throw new RuntimeException("Between values for " + property + " cannot be null");
            }
            criteria.add(new Criterion(condition, value1, value2));
        }

        public Criteria andIdIsNull() {
            addCriterion("id is null");
            return (Criteria) this;
        }

        public Criteria andIdIsNotNull() {
            addCriterion("id is not null");
            return (Criteria) this;
        }

        public Criteria andIdEqualTo(Integer value) {
            addCriterion("id =", value, "id");
            return (Criteria) this;
        }

        public Criteria andIdNotEqualTo(Integer value) {
            addCriterion("id <>", value, "id");
            return (Criteria) this;
        }

        public Criteria andIdGreaterThan(Integer value) {
            addCriterion("id >", value, "id");
            return (Criteria) this;
        }

        public Criteria andIdGreaterThanOrEqualTo(Integer value) {
            addCriterion("id >=", value, "id");
            return (Criteria) this;
        }

        public Criteria andIdLessThan(Integer value) {
            addCriterion("id <", value, "id");
            return (Criteria) this;
        }

        public Criteria andIdLessThanOrEqualTo(Integer value) {
            addCriterion("id <=", value, "id");
            return (Criteria) this;
        }

        public Criteria andIdIn(List<Integer> values) {
            addCriterion("id in", values, "id");
            return (Criteria) this;
        }

        public Criteria andIdNotIn(List<Integer> values) {
            addCriterion("id not in", values, "id");
            return (Criteria) this;
        }

        public Criteria andIdBetween(Integer value1, Integer value2) {
            addCriterion("id between", value1, value2, "id");
            return (Criteria) this;
        }

        public Criteria andIdNotBetween(Integer value1, Integer value2) {
            addCriterion("id not between", value1, value2, "id");
            return (Criteria) this;
        }

        public Criteria andGoodsNumberIsNull() {
            addCriterion("goods_number is null");
            return (Criteria) this;
        }

        public Criteria andGoodsNumberIsNotNull() {
            addCriterion("goods_number is not null");
            return (Criteria) this;
        }

        public Criteria andGoodsNumberEqualTo(String value) {
            addCriterion("goods_number =", value, "goodsNumber");
            return (Criteria) this;
        }

        public Criteria andGoodsNumberNotEqualTo(String value) {
            addCriterion("goods_number <>", value, "goodsNumber");
            return (Criteria) this;
        }

        public Criteria andGoodsNumberGreaterThan(String value) {
            addCriterion("goods_number >", value, "goodsNumber");
            return (Criteria) this;
        }

        public Criteria andGoodsNumberGreaterThanOrEqualTo(String value) {
            addCriterion("goods_number >=", value, "goodsNumber");
            return (Criteria) this;
        }

        public Criteria andGoodsNumberLessThan(String value) {
            addCriterion("goods_number <", value, "goodsNumber");
            return (Criteria) this;
        }

        public Criteria andGoodsNumberLessThanOrEqualTo(String value) {
            addCriterion("goods_number <=", value, "goodsNumber");
            return (Criteria) this;
        }

        public Criteria andGoodsNumberLike(String value) {
            addCriterion("goods_number like", value, "goodsNumber");
            return (Criteria) this;
        }

        public Criteria andGoodsNumberNotLike(String value) {
            addCriterion("goods_number not like", value, "goodsNumber");
            return (Criteria) this;
        }

        public Criteria andGoodsNumberIn(List<String> values) {
            addCriterion("goods_number in", values, "goodsNumber");
            return (Criteria) this;
        }

        public Criteria andGoodsNumberNotIn(List<String> values) {
            addCriterion("goods_number not in", values, "goodsNumber");
            return (Criteria) this;
        }

        public Criteria andGoodsNumberBetween(String value1, String value2) {
            addCriterion("goods_number between", value1, value2, "goodsNumber");
            return (Criteria) this;
        }

        public Criteria andGoodsNumberNotBetween(String value1, String value2) {
            addCriterion("goods_number not between", value1, value2, "goodsNumber");
            return (Criteria) this;
        }

        public Criteria andNameIsNull() {
            addCriterion("name is null");
            return (Criteria) this;
        }

        public Criteria andNameIsNotNull() {
            addCriterion("name is not null");
            return (Criteria) this;
        }

        public Criteria andNameEqualTo(String value) {
            addCriterion("name =", value, "name");
            return (Criteria) this;
        }

        public Criteria andNameNotEqualTo(String value) {
            addCriterion("name <>", value, "name");
            return (Criteria) this;
        }

        public Criteria andNameGreaterThan(String value) {
            addCriterion("name >", value, "name");
            return (Criteria) this;
        }

        public Criteria andNameGreaterThanOrEqualTo(String value) {
            addCriterion("name >=", value, "name");
            return (Criteria) this;
        }

        public Criteria andNameLessThan(String value) {
            addCriterion("name <", value, "name");
            return (Criteria) this;
        }

        public Criteria andNameLessThanOrEqualTo(String value) {
            addCriterion("name <=", value, "name");
            return (Criteria) this;
        }

        public Criteria andNameLike(String value) {
            addCriterion("name like", value, "name");
            return (Criteria) this;
        }

        public Criteria andNameNotLike(String value) {
            addCriterion("name not like", value, "name");
            return (Criteria) this;
        }

        public Criteria andNameIn(List<String> values) {
            addCriterion("name in", values, "name");
            return (Criteria) this;
        }

        public Criteria andNameNotIn(List<String> values) {
            addCriterion("name not in", values, "name");
            return (Criteria) this;
        }

        public Criteria andNameBetween(String value1, String value2) {
            addCriterion("name between", value1, value2, "name");
            return (Criteria) this;
        }

        public Criteria andNameNotBetween(String value1, String value2) {
            addCriterion("name not between", value1, value2, "name");
            return (Criteria) this;
        }

        public Criteria andPinyinIsNull() {
            addCriterion("pinyin is null");
            return (Criteria) this;
        }

        public Criteria andPinyinIsNotNull() {
            addCriterion("pinyin is not null");
            return (Criteria) this;
        }

        public Criteria andPinyinEqualTo(String value) {
            addCriterion("pinyin =", value, "pinyin");
            return (Criteria) this;
        }

        public Criteria andPinyinNotEqualTo(String value) {
            addCriterion("pinyin <>", value, "pinyin");
            return (Criteria) this;
        }

        public Criteria andPinyinGreaterThan(String value) {
            addCriterion("pinyin >", value, "pinyin");
            return (Criteria) this;
        }

        public Criteria andPinyinGreaterThanOrEqualTo(String value) {
            addCriterion("pinyin >=", value, "pinyin");
            return (Criteria) this;
        }

        public Criteria andPinyinLessThan(String value) {
            addCriterion("pinyin <", value, "pinyin");
            return (Criteria) this;
        }

        public Criteria andPinyinLessThanOrEqualTo(String value) {
            addCriterion("pinyin <=", value, "pinyin");
            return (Criteria) this;
        }

        public Criteria andPinyinLike(String value) {
            addCriterion("pinyin like", value, "pinyin");
            return (Criteria) this;
        }

        public Criteria andPinyinNotLike(String value) {
            addCriterion("pinyin not like", value, "pinyin");
            return (Criteria) this;
        }

        public Criteria andPinyinIn(List<String> values) {
            addCriterion("pinyin in", values, "pinyin");
            return (Criteria) this;
        }

        public Criteria andPinyinNotIn(List<String> values) {
            addCriterion("pinyin not in", values, "pinyin");
            return (Criteria) this;
        }

        public Criteria andPinyinBetween(String value1, String value2) {
            addCriterion("pinyin between", value1, value2, "pinyin");
            return (Criteria) this;
        }

        public Criteria andPinyinNotBetween(String value1, String value2) {
            addCriterion("pinyin not between", value1, value2, "pinyin");
            return (Criteria) this;
        }

        public Criteria andAcronymIsNull() {
            addCriterion("acronym is null");
            return (Criteria) this;
        }

        public Criteria andAcronymIsNotNull() {
            addCriterion("acronym is not null");
            return (Criteria) this;
        }

        public Criteria andAcronymEqualTo(String value) {
            addCriterion("acronym =", value, "acronym");
            return (Criteria) this;
        }

        public Criteria andAcronymNotEqualTo(String value) {
            addCriterion("acronym <>", value, "acronym");
            return (Criteria) this;
        }

        public Criteria andAcronymGreaterThan(String value) {
            addCriterion("acronym >", value, "acronym");
            return (Criteria) this;
        }

        public Criteria andAcronymGreaterThanOrEqualTo(String value) {
            addCriterion("acronym >=", value, "acronym");
            return (Criteria) this;
        }

        public Criteria andAcronymLessThan(String value) {
            addCriterion("acronym <", value, "acronym");
            return (Criteria) this;
        }

        public Criteria andAcronymLessThanOrEqualTo(String value) {
            addCriterion("acronym <=", value, "acronym");
            return (Criteria) this;
        }

        public Criteria andAcronymLike(String value) {
            addCriterion("acronym like", value, "acronym");
            return (Criteria) this;
        }

        public Criteria andAcronymNotLike(String value) {
            addCriterion("acronym not like", value, "acronym");
            return (Criteria) this;
        }

        public Criteria andAcronymIn(List<String> values) {
            addCriterion("acronym in", values, "acronym");
            return (Criteria) this;
        }

        public Criteria andAcronymNotIn(List<String> values) {
            addCriterion("acronym not in", values, "acronym");
            return (Criteria) this;
        }

        public Criteria andAcronymBetween(String value1, String value2) {
            addCriterion("acronym between", value1, value2, "acronym");
            return (Criteria) this;
        }

        public Criteria andAcronymNotBetween(String value1, String value2) {
            addCriterion("acronym not between", value1, value2, "acronym");
            return (Criteria) this;
        }

        public Criteria andCategoryIdIsNull() {
            addCriterion("category_id is null");
            return (Criteria) this;
        }

        public Criteria andCategoryIdIsNotNull() {
            addCriterion("category_id is not null");
            return (Criteria) this;
        }

        public Criteria andCategoryIdEqualTo(Integer value) {
            addCriterion("category_id =", value, "categoryId");
            return (Criteria) this;
        }

        public Criteria andCategoryIdNotEqualTo(Integer value) {
            addCriterion("category_id <>", value, "categoryId");
            return (Criteria) this;
        }

        public Criteria andCategoryIdGreaterThan(Integer value) {
            addCriterion("category_id >", value, "categoryId");
            return (Criteria) this;
        }

        public Criteria andCategoryIdGreaterThanOrEqualTo(Integer value) {
            addCriterion("category_id >=", value, "categoryId");
            return (Criteria) this;
        }

        public Criteria andCategoryIdLessThan(Integer value) {
            addCriterion("category_id <", value, "categoryId");
            return (Criteria) this;
        }

        public Criteria andCategoryIdLessThanOrEqualTo(Integer value) {
            addCriterion("category_id <=", value, "categoryId");
            return (Criteria) this;
        }

        public Criteria andCategoryIdIn(List<Integer> values) {
            addCriterion("category_id in", values, "categoryId");
            return (Criteria) this;
        }

        public Criteria andCategoryIdNotIn(List<Integer> values) {
            addCriterion("category_id not in", values, "categoryId");
            return (Criteria) this;
        }

        public Criteria andCategoryIdBetween(Integer value1, Integer value2) {
            addCriterion("category_id between", value1, value2, "categoryId");
            return (Criteria) this;
        }

        public Criteria andCategoryIdNotBetween(Integer value1, Integer value2) {
            addCriterion("category_id not between", value1, value2, "categoryId");
            return (Criteria) this;
        }

        public Criteria andSpecificationIsNull() {
            addCriterion("specification is null");
            return (Criteria) this;
        }

        public Criteria andSpecificationIsNotNull() {
            addCriterion("specification is not null");
            return (Criteria) this;
        }

        public Criteria andSpecificationEqualTo(String value) {
            addCriterion("specification =", value, "specification");
            return (Criteria) this;
        }

        public Criteria andSpecificationNotEqualTo(String value) {
            addCriterion("specification <>", value, "specification");
            return (Criteria) this;
        }

        public Criteria andSpecificationGreaterThan(String value) {
            addCriterion("specification >", value, "specification");
            return (Criteria) this;
        }

        public Criteria andSpecificationGreaterThanOrEqualTo(String value) {
            addCriterion("specification >=", value, "specification");
            return (Criteria) this;
        }

        public Criteria andSpecificationLessThan(String value) {
            addCriterion("specification <", value, "specification");
            return (Criteria) this;
        }

        public Criteria andSpecificationLessThanOrEqualTo(String value) {
            addCriterion("specification <=", value, "specification");
            return (Criteria) this;
        }

        public Criteria andSpecificationLike(String value) {
            addCriterion("specification like", value, "specification");
            return (Criteria) this;
        }

        public Criteria andSpecificationNotLike(String value) {
            addCriterion("specification not like", value, "specification");
            return (Criteria) this;
        }

        public Criteria andSpecificationIn(List<String> values) {
            addCriterion("specification in", values, "specification");
            return (Criteria) this;
        }

        public Criteria andSpecificationNotIn(List<String> values) {
            addCriterion("specification not in", values, "specification");
            return (Criteria) this;
        }

        public Criteria andSpecificationBetween(String value1, String value2) {
            addCriterion("specification between", value1, value2, "specification");
            return (Criteria) this;
        }

        public Criteria andSpecificationNotBetween(String value1, String value2) {
            addCriterion("specification not between", value1, value2, "specification");
            return (Criteria) this;
        }

        public Criteria andStatusIsNull() {
            addCriterion("status is null");
            return (Criteria) this;
        }

        public Criteria andStatusIsNotNull() {
            addCriterion("status is not null");
            return (Criteria) this;
        }

        public Criteria andStatusEqualTo(Integer value) {
            addCriterion("status =", value, "status");
            return (Criteria) this;
        }

        public Criteria andStatusNotEqualTo(Integer value) {
            addCriterion("status <>", value, "status");
            return (Criteria) this;
        }

        public Criteria andStatusGreaterThan(Integer value) {
            addCriterion("status >", value, "status");
            return (Criteria) this;
        }

        public Criteria andStatusGreaterThanOrEqualTo(Integer value) {
            addCriterion("status >=", value, "status");
            return (Criteria) this;
        }

        public Criteria andStatusLessThan(Integer value) {
            addCriterion("status <", value, "status");
            return (Criteria) this;
        }

        public Criteria andStatusLessThanOrEqualTo(Integer value) {
            addCriterion("status <=", value, "status");
            return (Criteria) this;
        }

        public Criteria andStatusIn(List<Integer> values) {
            addCriterion("status in", values, "status");
            return (Criteria) this;
        }

        public Criteria andStatusNotIn(List<Integer> values) {
            addCriterion("status not in", values, "status");
            return (Criteria) this;
        }

        public Criteria andStatusBetween(Integer value1, Integer value2) {
            addCriterion("status between", value1, value2, "status");
            return (Criteria) this;
        }

        public Criteria andStatusNotBetween(Integer value1, Integer value2) {
            addCriterion("status not between", value1, value2, "status");
            return (Criteria) this;
        }

        public Criteria andMinPriceIsNull() {
            addCriterion("min_price is null");
            return (Criteria) this;
        }

        public Criteria andMinPriceIsNotNull() {
            addCriterion("min_price is not null");
            return (Criteria) this;
        }

        public Criteria andMinPriceEqualTo(Float value) {
            addCriterion("min_price =", value, "minPrice");
            return (Criteria) this;
        }

        public Criteria andMinPriceNotEqualTo(Float value) {
            addCriterion("min_price <>", value, "minPrice");
            return (Criteria) this;
        }

        public Criteria andMinPriceGreaterThan(Float value) {
            addCriterion("min_price >", value, "minPrice");
            return (Criteria) this;
        }

        public Criteria andMinPriceGreaterThanOrEqualTo(Float value) {
            addCriterion("min_price >=", value, "minPrice");
            return (Criteria) this;
        }

        public Criteria andMinPriceLessThan(Float value) {
            addCriterion("min_price <", value, "minPrice");
            return (Criteria) this;
        }

        public Criteria andMinPriceLessThanOrEqualTo(Float value) {
            addCriterion("min_price <=", value, "minPrice");
            return (Criteria) this;
        }

        public Criteria andMinPriceIn(List<Float> values) {
            addCriterion("min_price in", values, "minPrice");
            return (Criteria) this;
        }

        public Criteria andMinPriceNotIn(List<Float> values) {
            addCriterion("min_price not in", values, "minPrice");
            return (Criteria) this;
        }

        public Criteria andMinPriceBetween(Float value1, Float value2) {
            addCriterion("min_price between", value1, value2, "minPrice");
            return (Criteria) this;
        }

        public Criteria andMinPriceNotBetween(Float value1, Float value2) {
            addCriterion("min_price not between", value1, value2, "minPrice");
            return (Criteria) this;
        }

        public Criteria andCapacityIsNull() {
            addCriterion("capacity is null");
            return (Criteria) this;
        }

        public Criteria andCapacityIsNotNull() {
            addCriterion("capacity is not null");
            return (Criteria) this;
        }

        public Criteria andCapacityEqualTo(Integer value) {
            addCriterion("capacity =", value, "capacity");
            return (Criteria) this;
        }

        public Criteria andCapacityNotEqualTo(Integer value) {
            addCriterion("capacity <>", value, "capacity");
            return (Criteria) this;
        }

        public Criteria andCapacityGreaterThan(Integer value) {
            addCriterion("capacity >", value, "capacity");
            return (Criteria) this;
        }

        public Criteria andCapacityGreaterThanOrEqualTo(Integer value) {
            addCriterion("capacity >=", value, "capacity");
            return (Criteria) this;
        }

        public Criteria andCapacityLessThan(Integer value) {
            addCriterion("capacity <", value, "capacity");
            return (Criteria) this;
        }

        public Criteria andCapacityLessThanOrEqualTo(Integer value) {
            addCriterion("capacity <=", value, "capacity");
            return (Criteria) this;
        }

        public Criteria andCapacityIn(List<Integer> values) {
            addCriterion("capacity in", values, "capacity");
            return (Criteria) this;
        }

        public Criteria andCapacityNotIn(List<Integer> values) {
            addCriterion("capacity not in", values, "capacity");
            return (Criteria) this;
        }

        public Criteria andCapacityBetween(Integer value1, Integer value2) {
            addCriterion("capacity between", value1, value2, "capacity");
            return (Criteria) this;
        }

        public Criteria andCapacityNotBetween(Integer value1, Integer value2) {
            addCriterion("capacity not between", value1, value2, "capacity");
            return (Criteria) this;
        }

        public Criteria andMiniUnitIsNull() {
            addCriterion("mini_unit is null");
            return (Criteria) this;
        }

        public Criteria andMiniUnitIsNotNull() {
            addCriterion("mini_unit is not null");
            return (Criteria) this;
        }

        public Criteria andMiniUnitEqualTo(String value) {
            addCriterion("mini_unit =", value, "miniUnit");
            return (Criteria) this;
        }

        public Criteria andMiniUnitNotEqualTo(String value) {
            addCriterion("mini_unit <>", value, "miniUnit");
            return (Criteria) this;
        }

        public Criteria andMiniUnitGreaterThan(String value) {
            addCriterion("mini_unit >", value, "miniUnit");
            return (Criteria) this;
        }

        public Criteria andMiniUnitGreaterThanOrEqualTo(String value) {
            addCriterion("mini_unit >=", value, "miniUnit");
            return (Criteria) this;
        }

        public Criteria andMiniUnitLessThan(String value) {
            addCriterion("mini_unit <", value, "miniUnit");
            return (Criteria) this;
        }

        public Criteria andMiniUnitLessThanOrEqualTo(String value) {
            addCriterion("mini_unit <=", value, "miniUnit");
            return (Criteria) this;
        }

        public Criteria andMiniUnitLike(String value) {
            addCriterion("mini_unit like", value, "miniUnit");
            return (Criteria) this;
        }

        public Criteria andMiniUnitNotLike(String value) {
            addCriterion("mini_unit not like", value, "miniUnit");
            return (Criteria) this;
        }

        public Criteria andMiniUnitIn(List<String> values) {
            addCriterion("mini_unit in", values, "miniUnit");
            return (Criteria) this;
        }

        public Criteria andMiniUnitNotIn(List<String> values) {
            addCriterion("mini_unit not in", values, "miniUnit");
            return (Criteria) this;
        }

        public Criteria andMiniUnitBetween(String value1, String value2) {
            addCriterion("mini_unit between", value1, value2, "miniUnit");
            return (Criteria) this;
        }

        public Criteria andMiniUnitNotBetween(String value1, String value2) {
            addCriterion("mini_unit not between", value1, value2, "miniUnit");
            return (Criteria) this;
        }

        public Criteria andDefaultUnitIdIsNull() {
            addCriterion("default_unit_id is null");
            return (Criteria) this;
        }

        public Criteria andDefaultUnitIdIsNotNull() {
            addCriterion("default_unit_id is not null");
            return (Criteria) this;
        }

        public Criteria andDefaultUnitIdEqualTo(Integer value) {
            addCriterion("default_unit_id =", value, "defaultUnitId");
            return (Criteria) this;
        }

        public Criteria andDefaultUnitIdNotEqualTo(Integer value) {
            addCriterion("default_unit_id <>", value, "defaultUnitId");
            return (Criteria) this;
        }

        public Criteria andDefaultUnitIdGreaterThan(Integer value) {
            addCriterion("default_unit_id >", value, "defaultUnitId");
            return (Criteria) this;
        }

        public Criteria andDefaultUnitIdGreaterThanOrEqualTo(Integer value) {
            addCriterion("default_unit_id >=", value, "defaultUnitId");
            return (Criteria) this;
        }

        public Criteria andDefaultUnitIdLessThan(Integer value) {
            addCriterion("default_unit_id <", value, "defaultUnitId");
            return (Criteria) this;
        }

        public Criteria andDefaultUnitIdLessThanOrEqualTo(Integer value) {
            addCriterion("default_unit_id <=", value, "defaultUnitId");
            return (Criteria) this;
        }

        public Criteria andDefaultUnitIdIn(List<Integer> values) {
            addCriterion("default_unit_id in", values, "defaultUnitId");
            return (Criteria) this;
        }

        public Criteria andDefaultUnitIdNotIn(List<Integer> values) {
            addCriterion("default_unit_id not in", values, "defaultUnitId");
            return (Criteria) this;
        }

        public Criteria andDefaultUnitIdBetween(Integer value1, Integer value2) {
            addCriterion("default_unit_id between", value1, value2, "defaultUnitId");
            return (Criteria) this;
        }

        public Criteria andDefaultUnitIdNotBetween(Integer value1, Integer value2) {
            addCriterion("default_unit_id not between", value1, value2, "defaultUnitId");
            return (Criteria) this;
        }

        public Criteria andStoragePartitionNumberIsNull() {
            addCriterion("storage_partition_number is null");
            return (Criteria) this;
        }

        public Criteria andStoragePartitionNumberIsNotNull() {
            addCriterion("storage_partition_number is not null");
            return (Criteria) this;
        }

        public Criteria andStoragePartitionNumberEqualTo(String value) {
            addCriterion("storage_partition_number =", value, "storagePartitionNumber");
            return (Criteria) this;
        }

        public Criteria andStoragePartitionNumberNotEqualTo(String value) {
            addCriterion("storage_partition_number <>", value, "storagePartitionNumber");
            return (Criteria) this;
        }

        public Criteria andStoragePartitionNumberGreaterThan(String value) {
            addCriterion("storage_partition_number >", value, "storagePartitionNumber");
            return (Criteria) this;
        }

        public Criteria andStoragePartitionNumberGreaterThanOrEqualTo(String value) {
            addCriterion("storage_partition_number >=", value, "storagePartitionNumber");
            return (Criteria) this;
        }

        public Criteria andStoragePartitionNumberLessThan(String value) {
            addCriterion("storage_partition_number <", value, "storagePartitionNumber");
            return (Criteria) this;
        }

        public Criteria andStoragePartitionNumberLessThanOrEqualTo(String value) {
            addCriterion("storage_partition_number <=", value, "storagePartitionNumber");
            return (Criteria) this;
        }

        public Criteria andStoragePartitionNumberLike(String value) {
            addCriterion("storage_partition_number like", value, "storagePartitionNumber");
            return (Criteria) this;
        }

        public Criteria andStoragePartitionNumberNotLike(String value) {
            addCriterion("storage_partition_number not like", value, "storagePartitionNumber");
            return (Criteria) this;
        }

        public Criteria andStoragePartitionNumberIn(List<String> values) {
            addCriterion("storage_partition_number in", values, "storagePartitionNumber");
            return (Criteria) this;
        }

        public Criteria andStoragePartitionNumberNotIn(List<String> values) {
            addCriterion("storage_partition_number not in", values, "storagePartitionNumber");
            return (Criteria) this;
        }

        public Criteria andStoragePartitionNumberBetween(String value1, String value2) {
            addCriterion("storage_partition_number between", value1, value2, "storagePartitionNumber");
            return (Criteria) this;
        }

        public Criteria andStoragePartitionNumberNotBetween(String value1, String value2) {
            addCriterion("storage_partition_number not between", value1, value2, "storagePartitionNumber");
            return (Criteria) this;
        }

        public Criteria andIsScanIsNull() {
            addCriterion("is_scan is null");
            return (Criteria) this;
        }

        public Criteria andIsScanIsNotNull() {
            addCriterion("is_scan is not null");
            return (Criteria) this;
        }

        public Criteria andIsScanEqualTo(Boolean value) {
            addCriterion("is_scan =", value, "isScan");
            return (Criteria) this;
        }

        public Criteria andIsScanNotEqualTo(Boolean value) {
            addCriterion("is_scan <>", value, "isScan");
            return (Criteria) this;
        }

        public Criteria andIsScanGreaterThan(Boolean value) {
            addCriterion("is_scan >", value, "isScan");
            return (Criteria) this;
        }

        public Criteria andIsScanGreaterThanOrEqualTo(Boolean value) {
            addCriterion("is_scan >=", value, "isScan");
            return (Criteria) this;
        }

        public Criteria andIsScanLessThan(Boolean value) {
            addCriterion("is_scan <", value, "isScan");
            return (Criteria) this;
        }

        public Criteria andIsScanLessThanOrEqualTo(Boolean value) {
            addCriterion("is_scan <=", value, "isScan");
            return (Criteria) this;
        }

        public Criteria andIsScanIn(List<Boolean> values) {
            addCriterion("is_scan in", values, "isScan");
            return (Criteria) this;
        }

        public Criteria andIsScanNotIn(List<Boolean> values) {
            addCriterion("is_scan not in", values, "isScan");
            return (Criteria) this;
        }

        public Criteria andIsScanBetween(Boolean value1, Boolean value2) {
            addCriterion("is_scan between", value1, value2, "isScan");
            return (Criteria) this;
        }

        public Criteria andIsScanNotBetween(Boolean value1, Boolean value2) {
            addCriterion("is_scan not between", value1, value2, "isScan");
            return (Criteria) this;
        }

        public Criteria andSingleCodeIsNull() {
            addCriterion("single_code is null");
            return (Criteria) this;
        }

        public Criteria andSingleCodeIsNotNull() {
            addCriterion("single_code is not null");
            return (Criteria) this;
        }

        public Criteria andSingleCodeEqualTo(String value) {
            addCriterion("single_code =", value, "singleCode");
            return (Criteria) this;
        }

        public Criteria andSingleCodeNotEqualTo(String value) {
            addCriterion("single_code <>", value, "singleCode");
            return (Criteria) this;
        }

        public Criteria andSingleCodeGreaterThan(String value) {
            addCriterion("single_code >", value, "singleCode");
            return (Criteria) this;
        }

        public Criteria andSingleCodeGreaterThanOrEqualTo(String value) {
            addCriterion("single_code >=", value, "singleCode");
            return (Criteria) this;
        }

        public Criteria andSingleCodeLessThan(String value) {
            addCriterion("single_code <", value, "singleCode");
            return (Criteria) this;
        }

        public Criteria andSingleCodeLessThanOrEqualTo(String value) {
            addCriterion("single_code <=", value, "singleCode");
            return (Criteria) this;
        }

        public Criteria andSingleCodeLike(String value) {
            addCriterion("single_code like", value, "singleCode");
            return (Criteria) this;
        }

        public Criteria andSingleCodeNotLike(String value) {
            addCriterion("single_code not like", value, "singleCode");
            return (Criteria) this;
        }

        public Criteria andSingleCodeIn(List<String> values) {
            addCriterion("single_code in", values, "singleCode");
            return (Criteria) this;
        }

        public Criteria andSingleCodeNotIn(List<String> values) {
            addCriterion("single_code not in", values, "singleCode");
            return (Criteria) this;
        }

        public Criteria andSingleCodeBetween(String value1, String value2) {
            addCriterion("single_code between", value1, value2, "singleCode");
            return (Criteria) this;
        }

        public Criteria andSingleCodeNotBetween(String value1, String value2) {
            addCriterion("single_code not between", value1, value2, "singleCode");
            return (Criteria) this;
        }

        public Criteria andWeightIsNull() {
            addCriterion("weight is null");
            return (Criteria) this;
        }

        public Criteria andWeightIsNotNull() {
            addCriterion("weight is not null");
            return (Criteria) this;
        }

        public Criteria andWeightEqualTo(Float value) {
            addCriterion("weight =", value, "weight");
            return (Criteria) this;
        }

        public Criteria andWeightNotEqualTo(Float value) {
            addCriterion("weight <>", value, "weight");
            return (Criteria) this;
        }

        public Criteria andWeightGreaterThan(Float value) {
            addCriterion("weight >", value, "weight");
            return (Criteria) this;
        }

        public Criteria andWeightGreaterThanOrEqualTo(Float value) {
            addCriterion("weight >=", value, "weight");
            return (Criteria) this;
        }

        public Criteria andWeightLessThan(Float value) {
            addCriterion("weight <", value, "weight");
            return (Criteria) this;
        }

        public Criteria andWeightLessThanOrEqualTo(Float value) {
            addCriterion("weight <=", value, "weight");
            return (Criteria) this;
        }

        public Criteria andWeightIn(List<Float> values) {
            addCriterion("weight in", values, "weight");
            return (Criteria) this;
        }

        public Criteria andWeightNotIn(List<Float> values) {
            addCriterion("weight not in", values, "weight");
            return (Criteria) this;
        }

        public Criteria andWeightBetween(Float value1, Float value2) {
            addCriterion("weight between", value1, value2, "weight");
            return (Criteria) this;
        }

        public Criteria andWeightNotBetween(Float value1, Float value2) {
            addCriterion("weight not between", value1, value2, "weight");
            return (Criteria) this;
        }

        public Criteria andVolumeIsNull() {
            addCriterion("volume is null");
            return (Criteria) this;
        }

        public Criteria andVolumeIsNotNull() {
            addCriterion("volume is not null");
            return (Criteria) this;
        }

        public Criteria andVolumeEqualTo(Float value) {
            addCriterion("volume =", value, "volume");
            return (Criteria) this;
        }

        public Criteria andVolumeNotEqualTo(Float value) {
            addCriterion("volume <>", value, "volume");
            return (Criteria) this;
        }

        public Criteria andVolumeGreaterThan(Float value) {
            addCriterion("volume >", value, "volume");
            return (Criteria) this;
        }

        public Criteria andVolumeGreaterThanOrEqualTo(Float value) {
            addCriterion("volume >=", value, "volume");
            return (Criteria) this;
        }

        public Criteria andVolumeLessThan(Float value) {
            addCriterion("volume <", value, "volume");
            return (Criteria) this;
        }

        public Criteria andVolumeLessThanOrEqualTo(Float value) {
            addCriterion("volume <=", value, "volume");
            return (Criteria) this;
        }

        public Criteria andVolumeIn(List<Float> values) {
            addCriterion("volume in", values, "volume");
            return (Criteria) this;
        }

        public Criteria andVolumeNotIn(List<Float> values) {
            addCriterion("volume not in", values, "volume");
            return (Criteria) this;
        }

        public Criteria andVolumeBetween(Float value1, Float value2) {
            addCriterion("volume between", value1, value2, "volume");
            return (Criteria) this;
        }

        public Criteria andVolumeNotBetween(Float value1, Float value2) {
            addCriterion("volume not between", value1, value2, "volume");
            return (Criteria) this;
        }

        public Criteria andExtIsNull() {
            addCriterion("ext is null");
            return (Criteria) this;
        }

        public Criteria andExtIsNotNull() {
            addCriterion("ext is not null");
            return (Criteria) this;
        }

        public Criteria andExtEqualTo(String value) {
            addCriterion("ext =", value, "ext");
            return (Criteria) this;
        }

        public Criteria andExtNotEqualTo(String value) {
            addCriterion("ext <>", value, "ext");
            return (Criteria) this;
        }

        public Criteria andExtGreaterThan(String value) {
            addCriterion("ext >", value, "ext");
            return (Criteria) this;
        }

        public Criteria andExtGreaterThanOrEqualTo(String value) {
            addCriterion("ext >=", value, "ext");
            return (Criteria) this;
        }

        public Criteria andExtLessThan(String value) {
            addCriterion("ext <", value, "ext");
            return (Criteria) this;
        }

        public Criteria andExtLessThanOrEqualTo(String value) {
            addCriterion("ext <=", value, "ext");
            return (Criteria) this;
        }

        public Criteria andExtLike(String value) {
            addCriterion("ext like", value, "ext");
            return (Criteria) this;
        }

        public Criteria andExtNotLike(String value) {
            addCriterion("ext not like", value, "ext");
            return (Criteria) this;
        }

        public Criteria andExtIn(List<String> values) {
            addCriterion("ext in", values, "ext");
            return (Criteria) this;
        }

        public Criteria andExtNotIn(List<String> values) {
            addCriterion("ext not in", values, "ext");
            return (Criteria) this;
        }

        public Criteria andExtBetween(String value1, String value2) {
            addCriterion("ext between", value1, value2, "ext");
            return (Criteria) this;
        }

        public Criteria andExtNotBetween(String value1, String value2) {
            addCriterion("ext not between", value1, value2, "ext");
            return (Criteria) this;
        }
    }

    public static class Criteria extends GeneratedCriteria {

        protected Criteria() {
            super();
        }
    }

    public static class Criterion {
        private String condition;

        private Object value;

        private Object secondValue;

        private boolean noValue;

        private boolean singleValue;

        private boolean betweenValue;

        private boolean listValue;

        private String typeHandler;

        public String getCondition() {
            return condition;
        }

        public Object getValue() {
            return value;
        }

        public Object getSecondValue() {
            return secondValue;
        }

        public boolean isNoValue() {
            return noValue;
        }

        public boolean isSingleValue() {
            return singleValue;
        }

        public boolean isBetweenValue() {
            return betweenValue;
        }

        public boolean isListValue() {
            return listValue;
        }

        public String getTypeHandler() {
            return typeHandler;
        }

        protected Criterion(String condition) {
            super();
            this.condition = condition;
            this.typeHandler = null;
            this.noValue = true;
        }

        protected Criterion(String condition, Object value, String typeHandler) {
            super();
            this.condition = condition;
            this.value = value;
            this.typeHandler = typeHandler;
            if (value instanceof List<?>) {
                this.listValue = true;
            } else {
                this.singleValue = true;
            }
        }

        protected Criterion(String condition, Object value) {
            this(condition, value, null);
        }

        protected Criterion(String condition, Object value, Object secondValue, String typeHandler) {
            super();
            this.condition = condition;
            this.value = value;
            this.secondValue = secondValue;
            this.typeHandler = typeHandler;
            this.betweenValue = true;
        }

        protected Criterion(String condition, Object value, Object secondValue) {
            this(condition, value, secondValue, null);
        }
    }
}