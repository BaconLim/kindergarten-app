import { useState, useEffect } from 'react';
import { api } from '../contexts/AuthContext';

const NOTE_OPTIONS = ['衣褲', '牙刷', '漱口杯', '衛生紙', '棉被清洗'];
const READ_OPTIONS = ['園訊', '餐點表', '通知單', '教學計劃', '班報', '口罩', '收據'];

function TeacherDashboard() {
  const [students, setStudents] = useState([]);
  const [books, setBooks] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [content, setContent] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [booksLoading, setBooksLoading] = useState(false);
  
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [selectedReads, setSelectedReads] = useState([]);
  
  const fetchStudents = async () => {
    try {
      const response = await api.post('', { action: 'get_my_students' });
      if (response.data.status === 'success') {
        const list = response.data.data;
        setStudents(list);
        if (list.length > 0) {
          setStudentId(list[0].id.toString());
        }
      }
    } catch (err) {
      console.error("無法載入學生名單", err);
    }
  };

  const fetchBooks = async () => {
    try {
      setBooksLoading(true);
      const response = await api.post('', { action: 'get_teacher_books' });
      if (response.data.status === 'success') {
        setBooks(response.data.data);
      }
    } catch (err) {
      console.error("無法載入歷史聯絡簿", err);
    } finally {
      setBooksLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchBooks();
  }, []);

  const handleCheckboxChange = (option, type) => {
    if (type === 'note') {
      setSelectedNotes(prev => prev.includes(option) ? prev.filter(i => i !== option) : [...prev, option]);
    } else {
      setSelectedReads(prev => prev.includes(option) ? prev.filter(i => i !== option) : [...prev, option]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const today = new Date().toISOString().split('T')[0];
      
      let finalContent = content;
      if (selectedNotes.length > 0) {
        finalContent += `\n\n【家長留意事項】：${selectedNotes.join('、')}`;
      }
      if (selectedReads.length > 0) {
        finalContent += `\n\n【資料詳讀】：${selectedReads.join('、')}`;
      }

      if (studentId === 'ALL') {
        const studentIds = students.map(s => s.id);
        const payload = {
          action: 'create_books_batch',
          payload: {
            student_ids: studentIds,
            date: today,
            content: finalContent
          }
        };
        const response = await api.post('', payload);
        if (response.data.status !== 'success') throw new Error('GAS Error');
        setSuccess(`已全班群發 (${studentIds.length} 篇)！`);
      } else {
        const payload = {
          action: 'create_book',
          payload: {
            student_id: parseInt(studentId),
            date: today,
            content: finalContent
          }
        };
        const response = await api.post('', payload);
        if (response.data.status !== 'success') throw new Error('GAS Error');
        setSuccess('聯絡簿草稿已建立，狀態為「待審核」！');
      }
      
      setContent(''); 
      setSelectedNotes([]);
      setSelectedReads([]);
      fetchBooks(); 
    } catch (err) {
      console.error(err);
      setError('建立失敗，請確認資料格式或權限。');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending_review':
        return <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full border border-yellow-200">待園長審核</span>;
      case 'published':
        return <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">家長未讀</span>;
      case 'replied':
      case 'closed':
        return <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full border border-green-200">家長已回</span>;
      default:
        return <span className="text-[10px] bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full border border-gray-200">{status}</span>;
    }
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto flex flex-col items-center w-full">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-800">教師工作面板</h2>
        <p className="text-gray-500 text-sm">撰寫並送出每日聯絡簿</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col w-full">
        <h3 className="text-base font-semibold text-gray-700 mb-4 flex items-center justify-center gap-2">
          <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
          新建聯絡簿
        </h3>

        {success && (
          <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm mb-4 border border-green-200 flex items-center justify-center w-full">
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path></svg>
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm mb-4 border border-red-100 flex items-center justify-center w-full">
             <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-5 w-full mt-2">
          
          <div className="flex flex-col items-center w-full border-b border-gray-100 pb-4">
            <label className="block text-sm font-bold text-indigo-700 mb-2 text-center">發送對象</label>
            <select 
              className="px-3 py-2 text-sm text-center rounded-lg border border-indigo-300 focus:ring-2 focus:ring-indigo-500 outline-none bg-indigo-50 mb-1 w-full max-w-xs font-semibold text-indigo-900"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            >
              {students.length === 0 ? (
                 <option value="">載入中或無學生...</option>
              ) : (
                <>
                  <option value="ALL">🌟 全班群發 (共 {students.length} 人)</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.id}號 - {s.name} ({s.display_class_name})</option>
                  ))}
                </>
              )}
            </select>
          </div>

          <div className="w-full text-sm">
            <label className="block font-semibold text-gray-700 mb-2">📎 家長留意事項</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {NOTE_OPTIONS.map(opt => (
                <label key={opt} className="flex items-center space-x-1 bg-gray-50 px-2 py-1 rounded-md border border-gray-200 cursor-pointer hover:bg-gray-100">
                  <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" checked={selectedNotes.includes(opt)} onChange={() => handleCheckboxChange(opt, 'note')} />
                  <span className="text-gray-600">{opt}</span>
                </label>
              ))}
            </div>

            <label className="block font-semibold text-gray-700 mb-2">📑 資料詳讀</label>
            <div className="flex flex-wrap gap-2">
              {READ_OPTIONS.map(opt => (
                <label key={opt} className="flex items-center space-x-1 bg-gray-50 px-2 py-1 rounded-md border border-gray-200 cursor-pointer hover:bg-gray-100">
                  <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" checked={selectedReads.includes(opt)} onChange={() => handleCheckboxChange(opt, 'read')} />
                  <span className="text-gray-600">{opt}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center w-full pt-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2 w-full text-left">✍️ 今日生活紀錄 (必填)</label>
            <textarea 
              required
              rows="5"
              className="px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none resize-none w-full"
              placeholder="例如：小明今天吃飯很快，有幫忙收玩具！"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            ></textarea>
          </div>

          <div className="w-full flex justify-end mt-4">
            <button 
              type="submit" 
              disabled={loading || !content || !studentId}
              className={`w-full sm:w-auto py-3 sm:py-2 px-8 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl sm:rounded-lg font-bold transition-colors flex items-center justify-center shadow-md ${loading || !content || !studentId ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? '送出中...' : studentId === 'ALL' ? '送出全班聯絡簿' : '送出單人聯絡簿'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col w-full mb-8">
        <h3 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          近期聯絡簿與家長回覆
        </h3>

        {booksLoading ? (
          <div className="text-center text-sm text-gray-500 py-4">載入中...</div>
        ) : books.length === 0 ? (
          <div className="text-center text-sm text-gray-400 py-4 border border-dashed border-gray-200 rounded-lg">尚無聯絡簿資料</div>
        ) : (
          <div className="space-y-4">
            {books.map(book => (
              <div key={book.id} className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="bg-gray-50 p-3 border-b border-gray-100 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-800 text-sm">{book.student_name}</span>
                    <span className="text-xs text-gray-500">{book.date.substring(0, 10)}</span>
                  </div>
                  {getStatusBadge(book.status)}
                </div>
                
                <div className="p-3">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{book.content}</p>
                </div>

                {book.parent_reply && (
                  <div className="bg-green-50 p-3 border-t border-green-100">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-5 h-5 rounded-full bg-green-200 text-green-800 flex items-center justify-center text-[10px] font-bold">家</div>
                      <span className="text-xs font-semibold text-green-800">家長回覆：</span>
                    </div>
                    <p className="text-sm text-green-900 ml-7 whitespace-pre-wrap">{book.parent_reply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

export default TeacherDashboard;
