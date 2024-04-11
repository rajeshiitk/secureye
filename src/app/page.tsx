import dynamic from "next/dynamic";

const MyComponent = dynamic(() => import("@/app/temp-pages/mainPage"), {
  ssr: false, // Disable SSR for this component
});

const MyPage = () => {
  return <MyComponent />;
};

export default MyPage;
