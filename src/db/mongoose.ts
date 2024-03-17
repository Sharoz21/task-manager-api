import { connect } from "mongoose";
import "dotenv/config";
const bootstrapDBConnection = async () => {
  try {
    await connect(process.env.MONGOOSE_CONNECTION_STRING as string);
    console.log("Monogo Connection Successfull!");
  } catch (e) {
    console.log(e);
  }
};

bootstrapDBConnection();
