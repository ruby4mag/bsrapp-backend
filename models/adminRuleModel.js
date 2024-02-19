import mongoose from "mongoose"

const ruleSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
        name: {
            type: String,
            required: true,
        },
        enabled: {
            type: Boolean,
            required: true,
            default: true
        },
        name: {
            type: String,
            required: true,
        },
        rule: {
            type: String,
            required: true,
            default: false,
        },
        setParam: {
            type: String,
            default: null,
        },
        setValue: {
            type: String,
            default: null,
        }
    },
    {
        timestamps: true,
    }
)






const AdminRule = mongoose.model("AdminRule", ruleSchema)

export default AdminRule
