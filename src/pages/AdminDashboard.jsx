import { useState, useEffect } from 'react';
import { api } from '../contexts/AuthContext';

function AdminDashboard() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [processing, setProcessing] = useState(false);

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

  const handlePublish = async (id) => {
    if (!window.confirm('確定要發布此聯絡簿嗎？')) return;
    try {
      setProcessing(true);
      const response = await api.post('', { 
        action: 'publish_book', 
        payload: { book_id: id } 
      });
      if (response.data.status !== 'success') throw new Error(response.data.message);
      setBooks(books.filter(b => b.id !== id));
    } catch (err) {
      console.error(err);
      alert('發布失敗，請稍後再試。');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('確定要刪除這筆聯絡簿嗎？老師將需要重新填寫。')) return;
    try {
      setProcessing(true);
      const response = await api.post('', { 
        action: 'delete_book', 
        payload: { book_id: id } 
      });
      if (response.data.status !== 'success') throw new Error(response.data.message);
      setBooks(books.filter(b => b.id !== id));
    } catch (err) {
      console.error(err);
      alert('刪除失敗，請稍後再試。');
    } finally {
      setProcessing(false);
    }
  };

  const handlePublishAll = async (classBooks) => {
    if (!window.confirm(`確定要一口氣發布這 ${classBooks.length} 篇聯絡簿嗎？`)) return;
    try {
      setProcessing(true);
      const ids = classBooks.map(b => b.id);
      const response = await api.post('', { 
        action: 'publish_all_books', 
        payload: { book_ids: ids } 
      });
      if (response.data.status !== 'success') throw new Error(response.data.message);
      setBooks(books.filter(b => !ids.includes(b.id)));
      alert('批次發布成功！');
    } catch (err) {
      console.error(err);
      alert('批次發布失敗，請稍後再試。');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="text-center mt-10 text-gray-500">載入中...</div>;

  const getDistinctClasses = () => {
    const classes = books.map(b => b.display_class_name || b.class_name || '未指定班級');
    return [...new Set(classes)];
  };

  const availableClasses = getDistinctClasses();
  
  // 畫面 1：選擇班級列表 (如果在沒有待審資料時，不顯示列表)
  if (books.length > 0 && selectedClass === '') {
    return (
      <div className="space-y-4 max-w-lg mx-auto flex flex-col items-center w-full">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">請選擇要審閱的班級</h2>
          <p className="text-gray-500 text-sm mt-1">目前共有 {books.length} 篇聯絡簿等待發布</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          {availableClasses.map(className => {
            const count = books.filter(b => (b.display_class_name || b.class_name || '未指定班級') === className).length;
            return (
              <button 
                key={className}
                onClick={() => setSelectedClass(className)}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col items-center"
              >
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                </div>
                <span className="text-lg font-bold text-gray-700">{className}</span>
                <span className="text-red-500 text-sm mt-1 font-medium">{count} 篇待審</span>
              </button>
            )
          })}
        </div>
      </div>
    );
  }

  // 畫面 2：特定班級的聯絡簿審核列表
  const filteredBooks = selectedClass === '全部' ? books : books.filter(b => (b.display_class_name || b.class_name || '未指定班級') === selectedClass);

  return (
    <div className="space-y-4 max-w-lg mx-auto flex flex-col items-center w-full">
      <div className="flex flex-col items-center text-center relative w-full">
        {selectedClass !== '' && books.length > 0 && (
          <button onClick={() => setSelectedClass('')} className="absolute left-0 top-0 text-gray-400 hover:text-indigo-600 flex items-center text-sm">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"></path></svg>
            回列表
          </button>
        )}
        <div>
          <h2 className="text-xl font-bold text-gray-800">{selectedClass || '園長審核中心'}</h2>
          <p className="text-gray-500 text-sm">目前有 {filteredBooks.length} 篇待審聯絡簿</p>
        </div>
        <button onClick={fetchPendingBooks} disabled={processing} className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition mt-2">
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm border border-red-100">
          {error}
        </div>
      )}

      {filteredBooks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center w-full mt-4">
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 text-gray-400">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <h3 className="text-base font-medium text-gray-700">太棒了！</h3>
          <p className="text-sm text-gray-500 mt-1">目前沒有需要審核的聯絡簿</p>
        </div>
      ) : (
        <div className="space-y-4 w-full mt-4 max-w-md mx-auto">
           {filteredBooks.map((book) => (
            <div key={book.id} className="bg-white rounded-xl shadow-sm border border-yellow-200 p-5 relative overflow-hidden flex flex-col w-full">
               <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-lg">
                待審核
              </div>
              
              <div className="flex flex-col mb-4 mt-2 w-full border-b border-gray-50 pb-3">
                <div className="text-lg font-bold text-indigo-700">
                  {book.student_name || '未知學生'}
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    {book.date.substring(0, 10)}
                  </span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <span>ID: {book.student_id}</span>
                </div>
              </div>
              <p className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-100 mb-4 w-full">
                {book.content}
              </p>
              
              <div className="w-full flex justify-end gap-2">
                <button 
                  onClick={() => handleDelete(book.id)}
                  disabled={processing}
                  className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 text-sm rounded-lg font-medium transition-colors flex items-center justify-center gap-2 "
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path></svg>
                  刪除
                </button>
                <button 
                  onClick={() => handlePublish(book.id)}
                  disabled={processing}
                  className="py-2 px-4 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-sm flex-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path></svg>
                  單篇發布
                </button>
              </div>
            </div>
          ))}
          
          <div className="w-full pt-4 pb-8">
             <button 
                onClick={() => handlePublishAll(filteredBooks)}
                disabled={processing}
                className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-base rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path></svg>
                全部發布 ({filteredBooks.length} 篇)
             </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
