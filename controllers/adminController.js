import asyncHandler from "express-async-handler"
import AdminRule from "../models/adminRuleModel.js"


const addAdminActivityRules = asyncHandler(async (req, res) => {
  const {
    name,
    rule,
    setParam,
    setValue,
  } = req.body


  const newrule = new AdminRule({

    user: req.user._id,
    name,
    rule,
    setParam,
    setValue,
  })
  const createdRule = await newrule.save()

  res.status(201).json(createdRule)

})

const getAdminRules = asyncHandler(async (req, res) => {
  const rules = await AdminRule.find({ user: req.user._id }).populate(
    "user",
    "id name"
  )
  res.json(rules)
})

const updateAdminRules = asyncHandler(async (req, res) => {

  const {
    name,
    rule,
    setParam,
    setValue,
  } = req.body

  const updateRule = await AdminRule.findOneAndUpdate({ user: req.user._id, _id: req.params.id }, { name, rule, setParam, setValue }, {
    new: true
  })
  //updateRule.update(name, rule, setParam, setValue)

  res.json(updateRule)
})


const getAdminRuleById = asyncHandler(async (req, res) => {
  const Rule = await AdminRule.findById(req.params.id).populate(
    "user",
    "name email"
  )
})

export { addAdminActivityRules, getAdminRules, updateAdminRules, getAdminRuleById }
