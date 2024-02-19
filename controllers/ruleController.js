import asyncHandler from "express-async-handler"
import Rule from "../models/ruleModel.js"


const addUserActivityRules = asyncHandler(async (req, res) => {
    const {
        name,
        rule,
        setParam,
        setValue,
    } = req.body


    const newrule = new Rule({

        user: req.user._id,
        name,
        rule,
        setParam,
        setValue,
    })
    const createdRule = await newrule.save()

    res.status(201).json(createdRule)

})

const getRules = asyncHandler(async (req, res) => {
    const rules = await Rule.find({ user: req.user._id }).populate(
        "user",
        "id name"
    )
    res.json(rules)
})

const updateRules = asyncHandler(async (req, res) => {

    const {
        name,
        rule,
        setParam,
        setValue,
    } = req.body

    const updateRule = await Rule.findOneAndUpdate({ user: req.user._id, _id: req.params.id }, { name, rule, setParam, setValue }, {
        new: true
    })
    //updateRule.update(name, rule, setParam, setValue)

    res.json(updateRule)
})

const createRules = asyncHandler(async (req, res) => {
    const rules = await Rule.find({ user: req.user._id }).populate(
        "user",
        "id name"
    )
    res.json(rules)
})

const getRuleById = asyncHandler(async (req, res) => {
    const Rule = await Rule.findById(req.params.id).populate(
        "user",
        "name email"
    )
})

export { getRuleById, getRules, addUserActivityRules, updateRules }
