a!formLayout(
  label: "Contact Form",
  contents: {
    a!textField(
      label: "Name",
      value: ri!name,
      saveInto: ri!name
    ),
    a!textField(
      label: "Email",
      value: ri!email,
      saveInto: ri!email
    )
  },
  buttons: a!buttonLayout(
    primaryButtons: a!buttonWidget(label: "Submit", submit: true, style: "PRIMARY")
  )
)
