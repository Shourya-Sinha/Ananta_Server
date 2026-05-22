export function SUCCESS(res, message = "Success", data = null, code = 200) {
  return res.status(code).json({
    success: true,
    code,
    message,
    data,
  });
}

export function ERROR(res, message = "Error", code = 500, error = null) {
  return res.status(code).json({
    success: false,
    code,
    message,
    error: error ? error.toString() : null,
  });
}