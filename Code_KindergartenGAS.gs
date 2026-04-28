/**
 * 幼兒園電子聯絡簿 - 穩定黃金版本 (GAS 後端)
 * 功能：登入、聯絡簿、批改、群發、基本資料
 */

const DB_MAP = {
  "sankuaicuo": "1ESBQqYLprfkhiBNvlrztjZBneYXJXF3Lyfyg1qmZzu4", 
  "ziqiang": "1AKzHrzrkpVBIO_WK_XURxpKMRGqkTc2q-MjvLHC9m_0",
  "fengshan": "1clRqbM7bs6Gu52lDfoXXZW5ypFcB7g0TLusVTm-Qsvo"
};

function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    const { action, payload, token } = request;
    
    // 登入不需要 Token
    if (action === 'login') return response(handleLogin(payload));

    const userData = verifyToken(token);
    if (!userData) return response({ status: 'error', message: '登入失敗或已過期' });
    
    const school = userData.school;

    switch (action) {
      case 'get_reviews': return response(handleGetReviews(school));
      case 'get_student_books': return response(handleGetStudentBooks(school, userData.student_id));
      case 'get_teacher_books': return response(handleGetTeacherBooks(school, userData.username));
      case 'get_my_students': return response(handleGetMyStudents(school, userData.username));
      case 'create_book': return response(handleCreateBook(school, userData.username, payload));
      case 'create_books_batch': return response(handleCreateBooksBatch(school, userData.username, payload));
      case 'publish_book': return response(handlePublishBook(school, payload));
      case 'edit_book': return response(handleEditBook(school, payload));
      case 'delete_book': return response(handleDeleteBook(school, payload));
      case 'reply_book': return response(handleReplyBook(school, payload));
      case 'get_profiles': return response(handleGetProfiles(school, userData.student_id, userData.role, userData.username));
      case 'save_profile': return response(handleSaveProfile(school, userData.student_id, payload));
      default: return response({ status: 'error', message: '未知行動' });
    }
  } catch (err) {
    return response({ status: 'error', message: err.toString() });
  }
}

// --- 核心邏輯 ---

function handleLogin(payload) {
  const { username, password } = payload;
  for (let key in DB_MAP) {
    try {
      const sheet = SpreadsheetApp.openById(DB_MAP[key]).getSheetByName('Users');
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const rows = data.slice(1);
      
      const user = rows.find(r => r[0] == username && r[1] == password);
      if (user) {
        const token = Utilities.base64Encode(JSON.stringify({
          username: user[0], role: user[2], school: key, student_id: user[3],
          exp: new Date().getTime() + 86400000
        }));
        return { status: 'success', data: { access_token: token } };
      }
    } catch(e) { continue; }
  }
  return { status: 'error', message: '帳號或密碼錯誤' };
}

function verifyToken(token) {
  if (!token) return null;
  try {
    const decoded = JSON.parse(Utilities.newBlob(Utilities.base64Decode(token)).getDataAsString());
    if (new Date().getTime() > decoded.exp) return null;
    return decoded;
  } catch(e) { return null; }
}

function getSheetData(ssId, sheetName) {
  const sheet = SpreadsheetApp.openById(ssId).getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  return data.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function handleGetStudentBooks(school, studentId) {
  const books = getSheetData(DB_MAP[school], 'ContactBooks');
  return { status: 'success', data: books.filter(b => b.student_id == studentId && b.status !== 'pending_review').reverse() };
}

function handleGetTeacherBooks(school, username) {
  const books = getSheetData(DB_MAP[school], 'ContactBooks');
  return { status: 'success', data: books.filter(b => b.teacher_username == username).reverse() };
}

function handleGetMyStudents(school, username) {
  const students = getSheetData(DB_MAP[school], 'Students');
  return { status: 'success', data: students.filter(s => s.teacher_username == username) };
}

function response(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

// ...其餘發布、批改、基本資料邏輯皆與昨日大功告成版本一致
