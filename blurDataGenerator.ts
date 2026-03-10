'use cache';

export const blurDataGenerator = async (id) => {
    const res = await fetch(`/api/images/${id}?w=8&q=10`);
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return `data:image/jpeg;base64,${base64}`;
};