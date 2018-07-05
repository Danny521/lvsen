package com.lvsen.modules.business.pojo;

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

        public Criteria andLvsenCodeIsNull() {
            addCriterion("lvsen_code is null");
            return (Criteria) this;
        }

        public Criteria andLvsenCodeIsNotNull() {
            addCriterion("lvsen_code is not null");
            return (Criteria) this;
        }

        public Criteria andLvsenCodeEqualTo(String value) {
            addCriterion("lvsen_code =", value, "lvsenCode");
            return (Criteria) this;
        }

        public Criteria andLvsenCodeNotEqualTo(String value) {
            addCriterion("lvsen_code <>", value, "lvsenCode");
            return (Criteria) this;
        }

        public Criteria andLvsenCodeGreaterThan(String value) {
            addCriterion("lvsen_code >", value, "lvsenCode");
            return (Criteria) this;
        }

        public Criteria andLvsenCodeGreaterThanOrEqualTo(String value) {
            addCriterion("lvsen_code >=", value, "lvsenCode");
            return (Criteria) this;
        }

        public Criteria andLvsenCodeLessThan(String value) {
            addCriterion("lvsen_code <", value, "lvsenCode");
            return (Criteria) this;
        }

        public Criteria andLvsenCodeLessThanOrEqualTo(String value) {
            addCriterion("lvsen_code <=", value, "lvsenCode");
            return (Criteria) this;
        }

        public Criteria andLvsenCodeLike(String value) {
            addCriterion("lvsen_code like", value, "lvsenCode");
            return (Criteria) this;
        }

        public Criteria andLvsenCodeNotLike(String value) {
            addCriterion("lvsen_code not like", value, "lvsenCode");
            return (Criteria) this;
        }

        public Criteria andLvsenCodeIn(List<String> values) {
            addCriterion("lvsen_code in", values, "lvsenCode");
            return (Criteria) this;
        }

        public Criteria andLvsenCodeNotIn(List<String> values) {
            addCriterion("lvsen_code not in", values, "lvsenCode");
            return (Criteria) this;
        }

        public Criteria andLvsenCodeBetween(String value1, String value2) {
            addCriterion("lvsen_code between", value1, value2, "lvsenCode");
            return (Criteria) this;
        }

        public Criteria andLvsenCodeNotBetween(String value1, String value2) {
            addCriterion("lvsen_code not between", value1, value2, "lvsenCode");
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

        public Criteria andAliasIsNull() {
            addCriterion("alias is null");
            return (Criteria) this;
        }

        public Criteria andAliasIsNotNull() {
            addCriterion("alias is not null");
            return (Criteria) this;
        }

        public Criteria andAliasEqualTo(String value) {
            addCriterion("alias =", value, "alias");
            return (Criteria) this;
        }

        public Criteria andAliasNotEqualTo(String value) {
            addCriterion("alias <>", value, "alias");
            return (Criteria) this;
        }

        public Criteria andAliasGreaterThan(String value) {
            addCriterion("alias >", value, "alias");
            return (Criteria) this;
        }

        public Criteria andAliasGreaterThanOrEqualTo(String value) {
            addCriterion("alias >=", value, "alias");
            return (Criteria) this;
        }

        public Criteria andAliasLessThan(String value) {
            addCriterion("alias <", value, "alias");
            return (Criteria) this;
        }

        public Criteria andAliasLessThanOrEqualTo(String value) {
            addCriterion("alias <=", value, "alias");
            return (Criteria) this;
        }

        public Criteria andAliasLike(String value) {
            addCriterion("alias like", value, "alias");
            return (Criteria) this;
        }

        public Criteria andAliasNotLike(String value) {
            addCriterion("alias not like", value, "alias");
            return (Criteria) this;
        }

        public Criteria andAliasIn(List<String> values) {
            addCriterion("alias in", values, "alias");
            return (Criteria) this;
        }

        public Criteria andAliasNotIn(List<String> values) {
            addCriterion("alias not in", values, "alias");
            return (Criteria) this;
        }

        public Criteria andAliasBetween(String value1, String value2) {
            addCriterion("alias between", value1, value2, "alias");
            return (Criteria) this;
        }

        public Criteria andAliasNotBetween(String value1, String value2) {
            addCriterion("alias not between", value1, value2, "alias");
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

        public Criteria andAliasPinyinIsNull() {
            addCriterion("alias_pinyin is null");
            return (Criteria) this;
        }

        public Criteria andAliasPinyinIsNotNull() {
            addCriterion("alias_pinyin is not null");
            return (Criteria) this;
        }

        public Criteria andAliasPinyinEqualTo(String value) {
            addCriterion("alias_pinyin =", value, "aliasPinyin");
            return (Criteria) this;
        }

        public Criteria andAliasPinyinNotEqualTo(String value) {
            addCriterion("alias_pinyin <>", value, "aliasPinyin");
            return (Criteria) this;
        }

        public Criteria andAliasPinyinGreaterThan(String value) {
            addCriterion("alias_pinyin >", value, "aliasPinyin");
            return (Criteria) this;
        }

        public Criteria andAliasPinyinGreaterThanOrEqualTo(String value) {
            addCriterion("alias_pinyin >=", value, "aliasPinyin");
            return (Criteria) this;
        }

        public Criteria andAliasPinyinLessThan(String value) {
            addCriterion("alias_pinyin <", value, "aliasPinyin");
            return (Criteria) this;
        }

        public Criteria andAliasPinyinLessThanOrEqualTo(String value) {
            addCriterion("alias_pinyin <=", value, "aliasPinyin");
            return (Criteria) this;
        }

        public Criteria andAliasPinyinLike(String value) {
            addCriterion("alias_pinyin like", value, "aliasPinyin");
            return (Criteria) this;
        }

        public Criteria andAliasPinyinNotLike(String value) {
            addCriterion("alias_pinyin not like", value, "aliasPinyin");
            return (Criteria) this;
        }

        public Criteria andAliasPinyinIn(List<String> values) {
            addCriterion("alias_pinyin in", values, "aliasPinyin");
            return (Criteria) this;
        }

        public Criteria andAliasPinyinNotIn(List<String> values) {
            addCriterion("alias_pinyin not in", values, "aliasPinyin");
            return (Criteria) this;
        }

        public Criteria andAliasPinyinBetween(String value1, String value2) {
            addCriterion("alias_pinyin between", value1, value2, "aliasPinyin");
            return (Criteria) this;
        }

        public Criteria andAliasPinyinNotBetween(String value1, String value2) {
            addCriterion("alias_pinyin not between", value1, value2, "aliasPinyin");
            return (Criteria) this;
        }

        public Criteria andAliasAcronymIsNull() {
            addCriterion("alias_acronym is null");
            return (Criteria) this;
        }

        public Criteria andAliasAcronymIsNotNull() {
            addCriterion("alias_acronym is not null");
            return (Criteria) this;
        }

        public Criteria andAliasAcronymEqualTo(String value) {
            addCriterion("alias_acronym =", value, "aliasAcronym");
            return (Criteria) this;
        }

        public Criteria andAliasAcronymNotEqualTo(String value) {
            addCriterion("alias_acronym <>", value, "aliasAcronym");
            return (Criteria) this;
        }

        public Criteria andAliasAcronymGreaterThan(String value) {
            addCriterion("alias_acronym >", value, "aliasAcronym");
            return (Criteria) this;
        }

        public Criteria andAliasAcronymGreaterThanOrEqualTo(String value) {
            addCriterion("alias_acronym >=", value, "aliasAcronym");
            return (Criteria) this;
        }

        public Criteria andAliasAcronymLessThan(String value) {
            addCriterion("alias_acronym <", value, "aliasAcronym");
            return (Criteria) this;
        }

        public Criteria andAliasAcronymLessThanOrEqualTo(String value) {
            addCriterion("alias_acronym <=", value, "aliasAcronym");
            return (Criteria) this;
        }

        public Criteria andAliasAcronymLike(String value) {
            addCriterion("alias_acronym like", value, "aliasAcronym");
            return (Criteria) this;
        }

        public Criteria andAliasAcronymNotLike(String value) {
            addCriterion("alias_acronym not like", value, "aliasAcronym");
            return (Criteria) this;
        }

        public Criteria andAliasAcronymIn(List<String> values) {
            addCriterion("alias_acronym in", values, "aliasAcronym");
            return (Criteria) this;
        }

        public Criteria andAliasAcronymNotIn(List<String> values) {
            addCriterion("alias_acronym not in", values, "aliasAcronym");
            return (Criteria) this;
        }

        public Criteria andAliasAcronymBetween(String value1, String value2) {
            addCriterion("alias_acronym between", value1, value2, "aliasAcronym");
            return (Criteria) this;
        }

        public Criteria andAliasAcronymNotBetween(String value1, String value2) {
            addCriterion("alias_acronym not between", value1, value2, "aliasAcronym");
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

        public Criteria andStorePositionNumberIsNull() {
            addCriterion("store_position_number is null");
            return (Criteria) this;
        }

        public Criteria andStorePositionNumberIsNotNull() {
            addCriterion("store_position_number is not null");
            return (Criteria) this;
        }

        public Criteria andStorePositionNumberEqualTo(String value) {
            addCriterion("store_position_number =", value, "storePositionNumber");
            return (Criteria) this;
        }

        public Criteria andStorePositionNumberNotEqualTo(String value) {
            addCriterion("store_position_number <>", value, "storePositionNumber");
            return (Criteria) this;
        }

        public Criteria andStorePositionNumberGreaterThan(String value) {
            addCriterion("store_position_number >", value, "storePositionNumber");
            return (Criteria) this;
        }

        public Criteria andStorePositionNumberGreaterThanOrEqualTo(String value) {
            addCriterion("store_position_number >=", value, "storePositionNumber");
            return (Criteria) this;
        }

        public Criteria andStorePositionNumberLessThan(String value) {
            addCriterion("store_position_number <", value, "storePositionNumber");
            return (Criteria) this;
        }

        public Criteria andStorePositionNumberLessThanOrEqualTo(String value) {
            addCriterion("store_position_number <=", value, "storePositionNumber");
            return (Criteria) this;
        }

        public Criteria andStorePositionNumberLike(String value) {
            addCriterion("store_position_number like", value, "storePositionNumber");
            return (Criteria) this;
        }

        public Criteria andStorePositionNumberNotLike(String value) {
            addCriterion("store_position_number not like", value, "storePositionNumber");
            return (Criteria) this;
        }

        public Criteria andStorePositionNumberIn(List<String> values) {
            addCriterion("store_position_number in", values, "storePositionNumber");
            return (Criteria) this;
        }

        public Criteria andStorePositionNumberNotIn(List<String> values) {
            addCriterion("store_position_number not in", values, "storePositionNumber");
            return (Criteria) this;
        }

        public Criteria andStorePositionNumberBetween(String value1, String value2) {
            addCriterion("store_position_number between", value1, value2, "storePositionNumber");
            return (Criteria) this;
        }

        public Criteria andStorePositionNumberNotBetween(String value1, String value2) {
            addCriterion("store_position_number not between", value1, value2, "storePositionNumber");
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