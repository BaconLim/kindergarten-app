import { useState, useEffect } from 'react';
import { api } from '../contexts/AuthContext';

function ParentDashboard() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyInputs, setReplyInputs] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const fetchBooks = async () => {
    try {
      const res = await api.post('', { action: 'get_student_books' });
      if (res.data.status === 'success') setBooks(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBooks(); }, []);

  const executeReplySubmit = async (bookId, quickReply = null) => {
    const finalReply = quickReply || replyInputs[bookId] || "已閱。";
    try {
      setLoading(true);
      await api.post('', { action: 'reply_book', payload: { book_id: String(bookId), parent_reply: finalReply } });
      alert('回覆成功！');
      fetchBooks();
    } catch (err) { alert('回覆失敗'); }
    finally { setLoading(false); }
  };

  const handleReplyClick = (bookId, quickReply = null) => {
    setConfirmDialog({
      isOpen: true,
      title: '確認回覆',
      message: quickReply ? `確定要一鍵回覆「${quickReply}」嗎？` : '確定要送出此文字回覆嗎？',
      onConfirm: () => executeReplySubmit(bookId, quickReply)
    });
  };

  if (loading && books.length === 0) return <div className="text-center mt-10">載入中...</div>;

  return (
    <div className="space-y-4 max-w-lg mx-auto pb-20">
      <h2 className="text-xl font-bold text-center">
        {books.length > 0 ? `${books[0].student_name} 的聯絡簿` : '聯絡簿紀錄'}
      </h2>
      {books.length === 0 ? <p className="text-center text-gray-400">目前尚無紀錄</p> : books.map(b => (
        <div key={b.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-gray-500 font-bold">{b.date.substring(0, 10)}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${b.parent_reply ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{b.parent_reply ? '已回覆' : '待回覆'}</span>
          </div>
          <p className="text-sm text-gray-800 whitespace-pre-wrap bg-indigo-50 p-3 rounded-lg">{b.content}</p>
          
          {!b.parent_reply && (
            <div className="mt-3 space-y-2">
              <textarea placeholder="寫給老師的話..." className="w-full p-2 border rounded-lg text-xs" value={replyInputs[b.id] || ''} onChange={e => setReplyInputs({...replyInputs, [b.id]: e.target.value})} />
              <div className="flex gap-2">
                <button onClick={() => handleReplyClick(b.id, "已看過")} className="flex-1 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-bold">一鍵回覆「已看過」</button>
                <button onClick={() => handleReplyClick(b.id)} disabled={!replyInputs[b.id]} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold disabled:opacity-50">送出文字回覆</button>
              </div>
            </div>
          )}
          
          {b.parent_reply && (
            <div className="mt-3 space-y-2">
              <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600 border-l-4 border-green-400 font-bold">您的回覆：{b.parent_reply}</div>
              {b.teacher_reply && (
                <div className="p-3 bg-indigo-50 rounded-lg text-xs text-indigo-700 border-l-4 border-indigo-400 font-bold">老師的回覆：{b.teacher_reply}</div>
              )}
            </div>
          )}
        </div>
      ))}

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

export default ParentDashboard;
