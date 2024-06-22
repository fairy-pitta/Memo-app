
const API_BASE_URL = 'http://localhost:8000/api/memos/';

export const createMemo = async (title: string, content: string) => {
    const response = await fetch(`${API_BASE_URL}`,{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({title, content})
    });

    if (!response.ok){
        throw new Error("failed to create memo")
    }

    return await response.json()
};

export const fetchMemos = async () => {
    const response = await fetch(`${API_BASE_URL}`);

    if (!response.ok){
        throw new Error('failed to fetch the data');
    }

    return await response.json();
};

export const updateMemo = async (id: number, title: string, content: string) => {
    const response = await fetch(`${API_BASE_URL}${id}/`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, content }),
    });
    if (!response.ok) {
        throw new Error('Failed to update memo');
    }
    return await response.json();
};

export const deleteMemo = async (id : number) => {
    const response = await fetch(`${API_BASE_URL}${id}`, {
        method: 'DELETE',
    });

    if (!response.ok){
        throw new Error("failed to delete memo")
    }

};

