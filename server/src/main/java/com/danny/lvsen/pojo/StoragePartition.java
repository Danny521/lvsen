package com.danny.lvsen.pojo;

public class StoragePartition {
    private Integer id;

    private String partitionNumber;

    private Integer storageId;

    private String area;

    private Integer row;

    private Integer layer;

    private Integer place;

    private Boolean status;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getPartitionNumber() {
        return partitionNumber;
    }

    public void setPartitionNumber(String partitionNumber) {
        this.partitionNumber = partitionNumber == null ? null : partitionNumber.trim();
    }

    public Integer getStorageId() {
        return storageId;
    }

    public void setStorageId(Integer storageId) {
        this.storageId = storageId;
    }

    public String getArea() {
        return area;
    }

    public void setArea(String area) {
        this.area = area == null ? null : area.trim();
    }

    public Integer getRow() {
        return row;
    }

    public void setRow(Integer row) {
        this.row = row;
    }

    public Integer getLayer() {
        return layer;
    }

    public void setLayer(Integer layer) {
        this.layer = layer;
    }

    public Integer getPlace() {
        return place;
    }

    public void setPlace(Integer place) {
        this.place = place;
    }

    public Boolean getStatus() {
        return status;
    }

    public void setStatus(Boolean status) {
        this.status = status;
    }
}