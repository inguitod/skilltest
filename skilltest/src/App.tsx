import { Toaster } from "sonner";
import { WeatherPlannerPage } from "@/page/WeatherPlannerPage";

const App = () => {
	return (
		<>
			<WeatherPlannerPage />
			<Toaster richColors position="top-center" />
		</>
	);
};

export default App;
