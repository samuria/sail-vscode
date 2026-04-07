a!localVariables(
  local!numbers: {1, 2, 3, 4, 5},
  local!doubled: a!forEach(
    items: local!numbers,
    expression: fv!item * 2
  ),
  local!sum: sum(local!doubled),
  local!sum
)
