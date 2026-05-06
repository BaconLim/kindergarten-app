import { useState, useEffect } from 'react';
import { api } from '../contexts/AuthContext';

const NOTE_OPTIONS = ['衣褲', '牙刷', '漱口杯', '衛生紙', '棉被清洗', '口罩'];
const READ_OPTIONS = ['園訊', '餐點表', '通知單', '教學計劃', '班報', '收據', '學習單'];

function TeacherDashboard() {
  const [students, setStudents] = useState([]);
  const [books, setBooks] = useState([]);
  const [studentId, setStudentId] = useState('');
  
  // 公版與表現內容
  const [template, setTemplate] = useState({ course_content: '', other_announcements: '' });
  const [individualPerformance, setIndividualPerformance] = useState('');
  
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [selectedReads, setSelectedReads] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // 教師回覆狀態
  const [replyInputs, setReplyInputs] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const tplRes = await api.post('', { action: 'get_template' });
      if (tplRes.data.status === 'success') {
        setTemplate(tplRes.data.data);
      }
      
      const stuRes = await api.post('', { action: 'get_my_students' });
      if (stuRes.data.status === 'success') {
        setStudents(stuRes.data.data);
        if (stuRes.data.data.length > 0) setStudentId(stuRes.data.data[0].id.toString());
      }
      const bookRes = await api.post('', { action: 'get_teacher_books' });
      if (bookRes.data.status === 'success') setBooks(bookRes.data.data);
    } catch (err) { console.error(err); }
  };

  const handleToggle = (opt, list, setList) => {
    setList(list.includes(opt) ? list.filter(i => i !== opt) : [...list, opt]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 組合 A, B, C 三部分，但不寫入標題文字
      let finalContent = '';
      if (template.course_content) finalContent += `${template.course_content}\n\n`;
      finalContent += `${individualPerformance}\n\n`;
      if (template.other_announcements) finalContent += `${template.other_announcements}`;

      // 附加事項
      if (selectedNotes.length > 0) finalContent += `\n\n【家長留意事項】：${selectedNotes.join('、')}`;
      if (selectedReads.length > 0) finalContent += `\n\n【資料詳讀】：${selectedReads.join('、')}`;

      const action = studentId === 'ALL' ? 'create_books_batch' : 'create_book';
      const payload = studentId === 'ALL' 
        ? { student_ids: students.map(s => s.id), content: finalContent }
        : { student_id: parseInt(studentId), content: finalContent };

      await api.post('', { action, payload });
      alert('發送成功！');
      setIndividualPerformance(''); setSelectedNotes([]); setSelectedReads([]);
      fetchData();
    } catch (err) { alert('發送失敗'); }
    finally { setLoading(false); }
  };

  const executeTeacherReply = async (bookId) => {
    try {
      setLoading(true);
      await api.post('', { 
        action: 'teacher_reply_book', 
        payload: { book_id: String(bookId), teacher_reply: replyInputs[bookId] } 
      });
      alert('回覆成功！');
      fetchData();
    } catch (err) {
      alert('回覆失敗，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  const handleReplyClick = (bookId) => {
    if (!replyInputs[bookId]) return;
    setConfirmDialog({
      isOpen: true,
      title: '確認回覆',
      message: '確定要送出此回覆嗎？（發送後無法修改）',
      onConfirm: () => executeTeacherReply(bookId)
    });
  };

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6 pb-20">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-4">新建聯絡簿</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-indigo-700 mb-1">發送對象</label>
            <select className="w-full p-2 border rounded-lg bg-indigo-50 font-bold" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="ALL">🌟 全班群發 (共 {students.length} 人)</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.display_class_name})</option>)}
            </select>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">A. 課程內容分享 (公版)</label>
              <textarea className="w-full p-2 border bg-gray-100 rounded-lg text-sm text-gray-600" rows="2" value={template.course_content || '無公版內容'} disabled />
            </div>
            <div>
              <label className="block text-sm font-bold text-indigo-700 mb-1">B. 孩子個別表現</label>
              <textarea className="w-full p-3 border border-indigo-300 rounded-xl text-sm focus:ring focus:ring-indigo-200" rows="4" placeholder="請填寫孩子的個別表現..." value={individualPerformance} onChange={(e) => setIndividualPerformance(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">C. 其他注意事項 (公版)</label>
              <textarea className="w-full p-2 border bg-gray-100 rounded-lg text-sm text-gray-600" rows="2" value={template.other_announcements || '無注意事項'} disabled />
            </div>
          </div>
          
          <div className="space-y-2 pt-2">
            <label className="block text-sm font-bold">📎 家長留意事項</label>
            <div className="flex flex-wrap gap-2">
              {NOTE_OPTIONS.map(opt => (
                <button type="button" key={opt} onClick={() => handleToggle(opt, selectedNotes, setSelectedNotes)} className={`px-3 py-1 rounded-full text-xs border ${selectedNotes.includes(opt) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-600'}`}>{opt}</button>
              ))}
            </div>
            <label className="block text-sm font-bold pt-2">📑 資料詳讀</label>
            <div className="flex flex-wrap gap-2">
              {READ_OPTIONS.map(opt => (
                <button type="button" key={opt} onClick={() => handleToggle(opt, selectedReads, setSelectedReads)} className={`px-3 py-1 rounded-full text-xs border ${selectedReads.includes(opt) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-600'}`}>{opt}</button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg disabled:opacity-50">
            {loading ? '傳送中...' : '送出聯絡簿'}
          </button>
        </form>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-gray-700">
          {studentId === 'ALL' 
            ? '全班近期聯絡簿' 
            : `${students.find(s => String(s.id) === String(studentId))?.name || '未知學生'} 的聯絡簿`}
        </h3>
        {books
          .filter(b => studentId === 'ALL' || String(b.student_id) === String(studentId))
          .map(b => (
          <div key={b.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold">{b.student_name} <span className="text-xs text-gray-500 font-normal">({b.date.substring(0, 10)})</span></span>
              <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full">{b.status === 'published' ? '已發布' : '待審核'}</span>
            </div>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{b.content}</p>
            
            {b.parent_reply && (
              <div className="mt-3 space-y-2">
                <div className="p-2 bg-green-50 rounded text-xs text-green-700 font-bold border-l-4 border-green-400">家長回覆：{b.parent_reply}</div>
                
                {b.teacher_reply ? (
                  <div className="p-2 bg-indigo-50 rounded text-xs text-indigo-700 font-bold border-l-4 border-indigo-400">教師回覆：{b.teacher_reply}</div>
                ) : (
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="回覆家長..." 
                      className="flex-1 p-2 border rounded text-xs" 
                      value={replyInputs[b.id] || ''} 
                      onChange={e => setReplyInputs({...replyInputs, [b.id]: e.target.value})} 
                    />
                    <button 
                      onClick={() => handleReplyClick(b.id)} 
                      disabled={!replyInputs[b.id] || loading} 
                      className="px-3 py-2 bg-indigo-600 text-white rounded text-xs font-bold disabled:opacity-50"
                    >送出</button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 客製化確認彈窗 */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{confirmDialog.title || '確認操作'}</h3>
            <p className="text-gray-600 mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDialog({ isOpen: false })} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold">取消</button>
              <button onClick={() => {
                confirmDialog.onConfirm();
                setConfirmDialog({ isOpen: false });
              }} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold">確認執行</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherDashboard;
