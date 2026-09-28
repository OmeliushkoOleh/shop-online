import { Link } from "react-router-dom";
import "./LoginPage.css";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { LockFill, CaretRight, EnvelopeAtFill } from "react-bootstrap-icons";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";

const svgColor = "black";

const registerSchema = z.object({
  email: z
    .string()
    .min(1, "Email required")
    .email("Неверный формат Email адреса"),
  password: z
    .string()
    .min(6, "Пароль должен быть не менее 6 символов")
    .regex(/[A-Z]/, "Пароль должен содержать хотя бы одну заглавную букву")
    .regex(/[0-9]/, "Пароль должен содержать хотя бы одну цифру"),
});

const LoginPage = () => {
  const navigate = useNavigate();

  // 2. Инициализируем хук формы и связываем его с Zod схемой
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signIn = useAuthStore((state) => state.signIn);

  const onSubmit = async (data) => {
    try {
      const res = await signIn(data.email, data.password);
      console.log("успешный вход:", res.user);

      navigate("/");
    } catch (err) {
      console.error("Ошибка входа:", err.message);
    }
  };

  return (
    <div className="login-page">
      <form className="reg-form" onSubmit={handleSubmit(onSubmit)} style={{}}>
        <h2>Sign In</h2>
        <Link className="link" to="/register">
          <div className="caret-right-div">
            To Registration
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

        {/* Поле Пароль */}
        <div className="row-div">
          <div className="input-title">Password</div>
          <div className="input-div">
            <span></span>
            <input
              {...register("password")}
              type="password"
              placeholder="Password *"
              autoComplete="current-password"
            />
          </div>
          {errors.password && <p>{errors.password.message}</p>}
        </div>

        <button type="submit" className="submit-button" disabled={isSubmitting}>
          {"Sign In"}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
