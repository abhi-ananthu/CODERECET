import { login } from '../../lib/data';

const LoginComponent = async ({ email, password }) => {
    const Login = await login(email, password);
    return (
        <>
            <button onClick={Login}
                type="submit"
                className="w-full bg-[#545334] text-[#DAD7B6] py-2 rounded-md text-lg font-medium hover:bg-[#434323] transition"
            >
                Login
            </button>
        </>
    );
};

export default LoginComponent;