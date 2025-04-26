//validations.ts
export const validatePhone = (phone: string): string => {
    return /^\+[0-9]{6,15}$/.test(phone)
        ? ''
        : 'Неверный формат (+ и 6-15 цифр)';
};

export const UI_validatePhone = (phone: string) => {
    if (!phone) return ''; // Не показываем ошибку если поле пустое
    return /^\+[0-9]{6,15}$/.test(phone)
        ? ''
        : 'Неверный формат (+ и 6-15 цифр)';
};

export const validateName = (name: string): string => {
    return name.trim().length >= 2
        ? ''
        : 'Имя должно быть не короче 2 символов';
};




//1. Создайте файл validations.ts
//
// typescript
// // utils/validations.ts
// export const validatePhone = (phone: string): string => {
//   return /^\+[0-9]{6,15}$/.test(phone)
//     ? ''
//     : 'Неверный формат (+ и 6-15 цифр)';
// };
//
// export const validateName = (name: string): string => {
//   return name.trim().length >= 2
//     ? ''
//     : 'Имя должно быть не короче 2 символов';
// };
// 2. Модифицированный компонент формы
//
// tsx
// import { validatePhone, validateName } from '@/utils/validations';
//
// // Внутри компонента:
// const [validationErrors, setValidationErrors] = useState({
//   phone: '',
//   name: '',
//   services: ''
// });
//
// // Обновленный блок с телефоном
// <div className="form-group">
//   <label className="block font-semibold mb-1">Телефон:</label>
//   <input
//     type="tel"
//     value={form.client_phone}
//     onChange={e => {
//       setForm({...form, client_phone: e.target.value});
//       setValidationErrors(prev => ({
//         ...prev,
//         phone: validatePhone(e.target.value)
//       }));
//     }}
//     className={`w-full p-2 border rounded ${
//       validationErrors.phone ? 'border-red-500' : 'border-gray-300'
//     }`}
//     placeholder="+1234567890"
//   />
//   {validationErrors.phone && (
//     <div className="text-red-500 text-sm mt-1">{validationErrors.phone}</div>
//   )}
// </div>
//
// // Аналогично для других полей
// 3. Обновленный обработчик отправки
//
// tsx
// const handleSubmit = () => {
//   const errors = {
//     phone: validatePhone(form.client_phone),
//     name: validateName(form.client_name),
//     services: form.services.length === 0 ? 'Добавьте хотя бы одну услугу' : ''
//   };
//
//   setValidationErrors(errors);
//
//   if (Object.values(errors).some(error => error)) return;
//
//   // Логика отправки данных
// };
