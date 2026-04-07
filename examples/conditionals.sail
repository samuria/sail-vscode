a!localVariables(
  local!score: ri!inputScore,
  if(
    local!score >= 90,
    "A",
    if(
      local!score >= 80,
      "B",
      if(
        local!score >= 70,
        "C",
        "F"
      )
    )
  )
)
