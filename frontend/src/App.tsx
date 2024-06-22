import React, {useState, useEffect} from 'react';
import { fetchMemos, createMemo, deleteMemo, updateMemo } from './api';
import './App.css';

const App: React.FC = () => {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null);

  interface Memo {
    id: number;
    title: string;
    content: string; 
  };

  const fetchInitialMemos = async () => {
    try {
        const initialMemos = await fetchMemos();
        setMemos(initialMemos);
    } catch (error) {
        console.error('Failed to fetch memos', error);
    }
  };

  useEffect(() => {
    fetchInitialMemos();
}, []);

const handleCreateMemo = async () => {

  if (title.trim() === '' || content.trim() === ''){
    alert("Title and Content are required");
    return;
  }

  try {
    const newMemo = await createMemo(title, content);
    setMemos([...memos, newMemo]);
    setTitle('');
    setContent('');
  } catch (error) {
    console.error("failed to create memo", error);
  }
};

const handleDeleteMemo = async (id: number) => {
  try {
    await deleteMemo(id);
    setMemos(memos.filter((memo) => memo.id !== id));
  } catch (error) {
    console.error("failed to delete memo", error);
  }
};

const handleEditMemo = (memo: Memo) => {
  setEditingMemo(memo);
  setTitle(memo.title);
  setContent(memo.content);
};

const handleUpdateMemo = async () => {
  if (editingMemo) {
      try {
          const updatedMemo = await updateMemo(editingMemo.id, title, content);
          setMemos(memos.map((memo) => (memo.id === updatedMemo.id ? updatedMemo : memo)));
          setEditingMemo(null);
          setTitle('');
          setContent('');
      } catch (error) {
          console.error("Failed to update memo", error);
      }
  }
};


  return (
    <div className="container">
      <h1>Memo App</h1>
      <div className="InputArea">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button onClick={handleUpdateMemo}>Update Memo</button>
        <button onClick={handleCreateMemo}>Add Memo</button>
        <button onClick={fetchInitialMemos}>Refresh Memos</button>
      </div>

      <ul>
        {memos.map((memo) => (
          <li key={memo.id}>
            <h2>{memo.title}</h2>
            <p>{memo.content}</p>
            <button onClick={() => handleEditMemo(memo)}>Edit</button>
            <button onClick={() => handleDeleteMemo(memo.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
