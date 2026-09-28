import "./RegisterPage.css";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useAuthStore } from "../../store/authStore";
import {
  TelephoneFill,
  PersonFill,
  EnvelopeAtFill,
  LockFill,
  CaretRight,
} from "react-bootstrap-icons";

const svgColor = "black";
const registerSchema = z.object({
  name: z.string().min(2, "Имя должно содержать минимум 2 символа"),

  email: z
    .string()
    .min(1, "Email required")
    .email("Неверный формат Email адреса"),

  phone: z
    .string()
    .min(1, "Телефон обязателен")
    .refine((val) => isValidPhoneNumber(val), {
      message: "Некорректный номер телефона",
    }),

  password: z
    .string()
    .min(6, "Пароль должен быть не менее 6 символов")
    .regex(/[A-Z]/, "Пароль должен содержать хотя бы одну заглавную букву")
    .regex(/[0-9]/, "Пароль должен содержать хотя бы одну цифру"),
});

export const RegisterPage = () => {
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);

  const signUp = useAuthStore((state) => state.signUp);

  // 2. Инициализируем хук формы и связываем его с Zod схемой
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
    },
  });

  const phoneValue = watch("phone");

  // 3. Функция отправки (вызовется только если валидация пройдена)

  const onSubmit = async (data) => {
    try {
      const res = await signUp(
        data.email,
        data.password,
        data.phone,
        data.name,
      );
      console.log("Данные созданного пользователя:", res.user);

      navigate("/");
    } catch (err: any) {
      console.error("Ошибка при регистрации:", err.message);
    }
  };

  return (
    <div className="register">
      <form className="reg-form" onSubmit={handleSubmit(onSubmit)} style={{}}>
        <h2>Registration</h2>
        <Link className="link" to="/login">
          <div className="caret-right-div">
            To Sign In
            <CaretRight size={25} color={svgColor} />
          </div>
        </Link>

        <div className="row-div">
          <div className="input-title">Your Email</div>
          <div className="input-div">
            <span></span>
            <input
              {...register("email")}
              type="email"
              placeholder="Email *"
              autoComplete="email"
            />
          </div>
          {errors.email && <p>{errors.email.message}</p>}
        </div>

        <div className="row-div">
          <div className="input-title">Password</div>
          <div className="input-div">
            <span></span>
            <input
              {...register("password")}
              type="password"
              placeholder="Password *"
              autoComplete="new-password"
            />
          </div>
          {errors.password && <p>{errors.password.message}</p>}
        </div>

        <div className="row-div">
          <div className="input-title">Your Name</div>
          <div className="input-div">
            <span></span>
            <input {...register("name")} placeholder="Name *" />
          </div>
          {errors.name && <p>{errors.name.message}</p>}
        </div>

        <div className="row-div">
          <div className="input-title">Your Phone</div>
          <div className="input-div">
            <span className="telephone-style-span"></span>
            <PhoneInput
              defaultCountry="UA"
              value={phoneValue}
              onChange={(val) =>
                setValue("phone", val || "", { shouldValidate: true })
              }
              placeholder="Phone *"
            />
          </div>
          {errors.phone && <p>{errors.phone.message}</p>}
        </div>

        <button type="submit" className="submit-button" disabled={isSubmitting}>
          {"Sign Up"}
        </button>
      </form>
    </div>
  );
};
export default RegisterPage;
