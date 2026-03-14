function doPost(e) {
  const result = ContentService.createTextOutput(JSON.stringify({ ok: true }));
  result.setMimeType(ContentService.MimeType.JSON);
  result.setHeader('Access-Control-Allow-Origin', '*');
  return result;
}
