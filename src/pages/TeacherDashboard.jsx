import { useState, useEffect } from 'react';
import { api } from '../contexts/AuthContext';

const NOTE_OPTIONS = ['衣褲', '牙刷', '漱口杯', '衛生紙', '棉被清洗', '口罩'];
const READ_OPTIONS = ['園訊', '餐點表', '通知單', '教學計劃', '班報', '收據', '學習單'];

function TeacherDashboard() {
  const [students, setStudents] = useState([]);
  const [books, setBooks] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [content, setContent] = useState('');
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [selectedReads, setSelectedReads] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
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
      let finalContent = content;
      if (selectedNotes.length > 0) finalContent += `\n\n【家長留意事項】：${selectedNotes.join('、')}`;
      if (selectedReads.length > 0) finalContent += `\n\n【資料詳讀】：${selectedReads.join('、')}`;

      const action = studentId === 'ALL' ? 'create_books_batch' : 'create_book';
      const payload = studentId === 'ALL' 
        ? { student_ids: students.map(s => s.id), content: finalContent }
        : { student_id: parseInt(studentId), content: finalContent };

      await api.post('', { action, payload });
      alert('發送成功！');
      setContent(''); setSelectedNotes([]); setSelectedReads([]);
      fetchData();
    } catch (err) { alert('發送失敗'); }
    finally { setLoading(false); }
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
          
          <div className="space-y-2">
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

          <textarea className="w-full p-3 border rounded-xl text-sm" rows="4" placeholder="今日表現..." value={content} onChange={(e) => setContent(e.target.value)} required />
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
            {b.parent_reply && <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-700">家長回覆：{b.parent_reply}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TeacherDashboard;
