import { useState, useEffect } from 'react';
import { api } from '../contexts/AuthContext';

function AdminDashboard() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [processing, setProcessing] = useState(false);
  const [editingBookId, setEditingBookId] = useState(null);
  const [editContent, setEditContent] = useState('');

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const fetchPendingBooks = async () => {
    try {
      setLoading(true);
      const response = await api.post('', { action: 'get_reviews' });
      if (response.data.status === 'success') {
        setBooks(response.data.data);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      console.error(err);
      setError('無法載入待審核名單，請確認登入權限。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingBooks();
  }, []);

  const executePublish = async (id) => {
    try {
      setProcessing(true);
      const response = await api.post('', { 
        action: 'publish_book', 
        payload: { book_id: String(id) } 
      });
      if (response.data.status !== 'success') throw new Error(response.data.message);
      setBooks(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      console.error(err);
      alert('發布失敗，請稍後再試。');
    } finally {
      setProcessing(false);
    }
  };

  const executeDelete = async (id) => {
    try {
      setProcessing(true);
      const response = await api.post('', { 
        action: 'delete_book', 
        payload: { book_id: String(id) } 
      });
      if (response.data.status !== 'success') throw new Error(response.data.message);
      setBooks(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      console.error(err);
      alert('刪除失敗，請稍後再試。');
    } finally {
      setProcessing(false);
    }
  };

  const handleEditStart = (book) => {
    setEditingBookId(book.id);
    setEditContent(book.content);
  };

  const handleEditSave = async (id) => {
    try {
      setProcessing(true);
      const response = await api.post('', {
        action: 'edit_book',
        payload: { book_id: String(id), content: editContent }
      });
      if (response.data.status !== 'success') throw new Error(response.data.message);
      
      setBooks(prev => prev.map(b => b.id === id ? { ...b, content: editContent } : b));
      setEditingBookId(null);
    } catch (err) {
      console.error(err);
      alert('批改失敗，請稍後再試。');
    } finally {
      setProcessing(false);
    }
  };

  const executePublishAll = async (classBooks) => {
    try {
      setProcessing(true);
      const ids = classBooks.map(b => String(b.id));
      const response = await api.post('', { 
        action: 'publish_all_books', 
        payload: { book_ids: ids } 
      });
      if (response.data.status !== 'success') throw new Error(response.data.message);
      setBooks(prev => prev.filter(b => !ids.includes(String(b.id))));
      alert('批次發布成功！');
    } catch (err) {
      console.error(err);
      alert('批次發布失敗，請稍後再試。');
    } finally {
      setProcessing(false);
    }
  };

  // 點擊事件：開啟客製化確認對話框
  const handlePublishClick = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: '確認發布',
      message: '確定要發布此聯絡簿給家長嗎？',
      onConfirm: () => executePublish(id)
    });
  };

  const handleDeleteClick = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: '確認刪除',
      message: '確定要刪除這筆聯絡簿嗎？老師將需要重新填寫。',
      onConfirm: () => executeDelete(id)
    });
  };

  const handlePublishAllClick = (classBooks) => {
    setConfirmDialog({
      isOpen: true,
      title: '批次發布確認',
      message: `確定要一口氣發布這 ${classBooks.length} 篇聯絡簿嗎？`,
      onConfirm: () => executePublishAll(classBooks)
    });
  };

  if (loading) return <div className="text-center mt-10 text-gray-500">載入中...</div>;

  if (books.length === 0) {
    return (
      <div className="p-8 max-w-lg mx-auto mt-10 text-center bg-white rounded-3xl shadow-md border-2 border-green-200">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-green-600 mb-2">沒有待辦事項</h2>
        <p className="text-lg text-gray-700 font-bold">園長超棒！！今天也辛苦了！✨</p>
        <button onClick={fetchPendingBooks} className="mt-6 px-6 py-2 bg-green-50 text-green-700 rounded-full font-bold border border-green-200 hover:bg-green-100 transition">
          重新整理
        </button>
      </div>
    );
  }

  const availableClasses = [...new Set(books.map(b => b.display_class_name || b.class_name || '未指定班級'))];
  
  if (books.length > 0 && selectedClass === '') {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <h2 className="text-2xl font-bold text-center mb-6">請選擇班級</h2>
        <div className="grid gap-4">
          {availableClasses.map(cls => (
            <button key={cls} onClick={() => setSelectedClass(cls)} className="bg-white p-6 rounded-xl shadow-md border hover:border-indigo-500 transition">
              <span className="text-lg font-bold">{cls}</span>
              <span className="block text-red-500 text-sm">{books.filter(b => (b.display_class_name || b.class_name) === cls).length} 篇待審</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const filteredBooks = books.filter(b => (b.display_class_name || b.class_name || '未指定班級') === selectedClass);

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <button onClick={() => setSelectedClass('')} className="text-indigo-600">← 返回列表</button>
        <h2 className="text-xl font-bold">{selectedClass}</h2>
        <button onClick={fetchPendingBooks} className="p-2 bg-indigo-50 rounded-full">🔄</button>
      </div>

      {filteredBooks.map(book => (
        <div key={book.id} className="bg-white p-4 rounded-xl shadow-sm border border-yellow-200 space-y-3">
          <div className="font-bold text-indigo-700">{book.student_name} <span className="text-gray-400 font-normal">({book.date.substring(0,10)})</span></div>
          
          {editingBookId === book.id ? (
            <textarea className="w-full p-3 bg-yellow-50 border border-yellow-300 rounded-lg text-sm" rows="5" value={editContent} onChange={(e) => setEditContent(e.target.value)} />
          ) : (
            <p className="text-gray-800 text-sm bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{book.content}</p>
          )}

          <div className="flex gap-2">
            <button onClick={() => handleDeleteClick(book.id)} className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs">刪除</button>
            {editingBookId === book.id ? (
              <button onClick={() => handleEditSave(book.id)} className="flex-1 py-2 bg-yellow-500 text-white rounded-lg text-xs font-bold">確認批改</button>
            ) : (
              <button onClick={() => handleEditStart(book)} className="flex-1 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold">批改</button>
            )}
            <button onClick={() => handlePublishClick(book.id)} className="flex-1 py-2 bg-green-500 text-white rounded-lg text-xs font-bold">單篇發布</button>
          </div>
        </div>
      ))}
      
      {filteredBooks.length > 0 && (
        <button onClick={() => handlePublishAllClick(filteredBooks)} className="w-full py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg">
          全部發布 ({filteredBooks.length} 篇)
        </button>
      )}

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

export default AdminDashboard;
