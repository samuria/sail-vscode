a!queryRecordType(
  recordType: #"urn:appian:record-type:v1:abc123-def456-7890",
  filters: a!queryFilter(
    field: #"urn:appian:record-field:v1:abc123-def456-7890/status",
    operator: "=",
    value: "ACTIVE"
  ),
  pagingInfo: a!pagingInfo(startIndex: 1, batchSize: 25)
)
