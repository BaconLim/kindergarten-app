import { useState, useEffect } from 'react';
import { api } from '../contexts/AuthContext';

function ParentDashboard() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for handling replies
  const [replyInputs, setReplyInputs] = useState({});
  const [submittingReplyId, setSubmittingReplyId] = useState(null);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await api.post('', { action: 'get_student_books' });
      if (response.data.status === 'success') {
        setBooks(response.data.data);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      console.error(err);
      setError('無法載入聯絡簿，請確認網路連線與權限。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleReplyChange = (id, text) => {
    setReplyInputs(prev => ({ ...prev, [id]: text }));
  };

  const handleReplySubmit = async (bookId) => {
    const defaultReply = "已閱。";
    const finalReply = replyInputs[bookId] || defaultReply;

    try {
      setSubmittingReplyId(bookId);
      const response = await api.post('', {
        action: 'reply_book',
        payload: {
          book_id: bookId,
          parent_reply: finalReply
        }
      });
      if (response.data.status !== 'success') throw new Error(response.data.message);

      // Update local state and close the specific input
      fetchBooks();
    } catch (err) {
      console.error(err);
      alert('回覆失敗，可能您已經回覆過了。');
    } finally {
      setSubmittingReplyId(null);
    }
  };

  if (loading) return <div className="text-center mt-10 text-gray-500">載入中...</div>;

  const studentName = books.length > 0 ? books[0].student_name : "您孩子";

  return (
    <div className="space-y-4 max-w-xl mx-auto flex flex-col items-center w-full">
      <div className="flex flex-col items-center text-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">{studentName}的聯絡簿</h2>
          <p className="text-gray-500 text-sm mt-1">查看老師留言與回覆</p>
        </div>
        <button onClick={fetchBooks} className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition">
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm border border-red-100">
          {error}
        </div>
      )}

      {books.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center text-sm text-gray-500 w-full mt-4">
          目前沒有已發布的聯絡簿紀錄。
        </div>
      ) : (
        <div className="space-y-4 w-full mt-4">
          {books.map((book) => {
            const isReplied = book.status === 'replied' || book.status === 'closed';
            
            return (
              <div key={book.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Teacher Section */}
                <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs">
                        師
                      </div>
                      <span className="text-xs font-semibold text-gray-700">{book.date}</span>
                    </div>
                    {isReplied ? (
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">已回覆</span>
                    ) : (
                      <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full border border-red-200">等待回覆</span>
                    )}
                  </div>
                  <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap ml-8">
                    {book.content}
                  </p>
                </div>

                {/* Parent Section */}
                <div className="p-4 bg-white">
                  {book.parent_reply ? (
                    <div>
                       <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                          家
                        </div>
                        <span className="text-xs font-semibold text-gray-600">您的回覆：</span>
                      </div>
                      <p className="text-gray-700 text-sm ml-8 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        {book.parent_reply}
                      </p>
                    </div>
                  ) : (
                    <div className="ml-8">
                      <textarea
                        rows="3"
                        placeholder="請輸入給老師的回覆..."
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none resize-none mb-2"
                        value={replyInputs[book.id] || ''}
                        onChange={(e) => handleReplyChange(book.id, e.target.value)}
                      ></textarea>
                      <button 
                        onClick={() => handleReplySubmit(book.id)}
                        disabled={submittingReplyId === book.id || !(replyInputs[book.id]?.trim())}
                        className={`w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-xs transition-colors flex justify-center items-center gap-2 ${submittingReplyId === book.id || !(replyInputs[book.id]?.trim()) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {submittingReplyId === book.id ? '送出中...' : '送出回覆 (送出後無法修改)'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ParentDashboard;
