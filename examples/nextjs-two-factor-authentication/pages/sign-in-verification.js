import { useRouter } from "next/router";
import { useState, useRef, useContext } from "react";
import Button from "../components/ui/Button";
import { altogic } from "../helpers/client";
import ErrorMessage from "../components/ui/ErrorMessage";
import Counter from "../components/ui/Counter";
import { UserContext } from "../context/userContext";
import Image from "next/image";

function SignInSMSVerification(props) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const codeInputElement = useRef();
  const { authStateChanged, setIsAuth } = useContext(UserContext);

  async function handlePhoneVerify() {
    setLoading(true);
    try {
      const { data, errors } = await altogic.endpoint.post(
        "/user/verify-sign-in",
        {
          code: codeInputElement.current.value,
          userId: props.userId,
          phoneNumber: props.phoneNumber,
        }
      );
      if (!errors) {
        setMessage("");
        //Send a request to /api/login route to set the cookie for SSR.
        //Only needed if you are going to do SSR.
        await fetch("/api/login", {
          method: "POST",
          credentials: "same-origin",
          body: JSON.stringify({ token: data.session.token }),
          headers: { "Content-Type": "application/json" },
        });
        authStateChanged(data.session, data.found);
        setIsAuth(true);
        router.push("/profile");
      } else {
        setMessage(errors.items[0].message);
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      setMessage(error.message);
    }
  }

  return (
    <div className="flex bg-gray-bg1 my-8 mb-20">
      <div className="w-full max-w-md m-auto bg-white rounded-lg border border-primaryBorder shadow-lg py-1 px-16">
        <div className="min-h-full flex items-center justify-center py-5 px-4 sm:px-6 lg:px-8 ">
          <div className="max-w-md w-full space-y-8">
            <div>
              <div className="items-center justify-center px-4 sm:px-6 lg:px-8  ">
                <Image src={"/logo.png"} height={250} width={250}></Image>
              </div>
              <h2 className="font-semibold text-3xl text-center text-gray-900">
                Two-Factor Verification
              </h2>
              <p className="block mt-4 text-sm font-medium text-center text-slate-500">
                Enter the verification code we sent to your phone number:{" "}
                {props.phoneNumber}
              </p>
            </div>
            <Counter></Counter>

            <div className="mt-2">
              <input
                type="text"
                ref={codeInputElement}
                className="px-3 mt-7 py-2 bg-white border shadow-sm border-slate-300 placeholder-slate-400 disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 focus:outline-none focus:border-sky-500 focus:ring-sky-500 block w-full rounded-md sm:text-sm focus:ring-1 invalid:border-red-500 invalid:text-red-600 focus:invalid:border-red-500 focus:invalid:ring-red-500 disabled:shadow-none"
              />
            </div>
            <ErrorMessage message={message}></ErrorMessage>
            <div className="text-center">
              <Button
                loading={loading}
                buttonValue="Sign in"
                onClick={handlePhoneVerify}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  if (context.query.canVerify) {
    return {
      props: {
        phoneNumber: context.query.phoneNumber,
        canVerify: context.query.canVerify,
      },
    };
  } else {
    return {
      redirect: { destination: "/profile", permanent: false },
    };
  }
}
export default SignInSMSVerification;
