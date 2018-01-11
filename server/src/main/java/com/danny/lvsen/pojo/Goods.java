package com.danny.lvsen.pojo;

public class Goods {
    private Integer id;

    private String lvsenCode;

    private String name;

    private String alias;

    private String pinyin;

    private String acronym;

    private String aliasPinyin;

    private String aliasAcronym;

    private Integer categoryId;

    private String specification;

    private String storePositionNumber;

    private Integer status;

    private String ext;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getLvsenCode() {
        return lvsenCode;
    }

    public void setLvsenCode(String lvsenCode) {
        this.lvsenCode = lvsenCode == null ? null : lvsenCode.trim();
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name == null ? null : name.trim();
    }

    public String getAlias() {
        return alias;
    }

    public void setAlias(String alias) {
        this.alias = alias == null ? null : alias.trim();
    }

    public String getPinyin() {
        return pinyin;
    }

    public void setPinyin(String pinyin) {
        this.pinyin = pinyin == null ? null : pinyin.trim();
    }

    public String getAcronym() {
        return acronym;
    }

    public void setAcronym(String acronym) {
        this.acronym = acronym == null ? null : acronym.trim();
    }

    public String getAliasPinyin() {
        return aliasPinyin;
    }

    public void setAliasPinyin(String aliasPinyin) {
        this.aliasPinyin = aliasPinyin == null ? null : aliasPinyin.trim();
    }

    public String getAliasAcronym() {
        return aliasAcronym;
    }

    public void setAliasAcronym(String aliasAcronym) {
        this.aliasAcronym = aliasAcronym == null ? null : aliasAcronym.trim();
    }

    public Integer getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Integer categoryId) {
        this.categoryId = categoryId;
    }

    public String getSpecification() {
        return specification;
    }

    public void setSpecification(String specification) {
        this.specification = specification == null ? null : specification.trim();
    }

    public String getStorePositionNumber() {
        return storePositionNumber;
    }

    public void setStorePositionNumber(String storePositionNumber) {
        this.storePositionNumber = storePositionNumber == null ? null : storePositionNumber.trim();
    }

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }

    public String getExt() {
        return ext;
    }

    public void setExt(String ext) {
        this.ext = ext == null ? null : ext.trim();
    }
}