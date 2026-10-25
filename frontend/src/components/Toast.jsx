export default function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="cl-toast fixed top-4 right-4 z-50 bg-black text-white px-4 py-2 rounded-lg shadow-lg text-sm font-semibold">
      {toast.message}
    </div>
  );
}
