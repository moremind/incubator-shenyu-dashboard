/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { Component, Fragment } from "react";
import {Modal, Form, Switch, Input, Select, Divider, InputNumber, Tooltip, Button} from "antd";
import { connect } from "dva";
import styles from "./Modal.less";
import { getIntlContent } from "../../../utils/IntlUtils";

const { Option } = Select;
const FormItem = Form.Item;

@connect(({ global }) => ({
  platform: global.platform
}))
class AddModal extends Component {
  handleSubmit = e => {
    const { form, handleOk, id = "", data } = this.props;
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        let { name, role, enabled, config, sort } = values;
        if (data && data.length > 0) {
          config = {};
          data.forEach(item => {
            if (values[item.field]) {
              config[item.field] = values[item.field];
            }
          });
          config = JSON.stringify(config);
          if (config === "{}") {
            config = "";
          }
        }
        handleOk({ name, role, enabled, config, id, sort });
      }
    });
  };

  render() {
    let {
      handleCancel,
      form,
      config,
      name,
      enabled = true,
      role,
      id,
      data,
      sort,
      selectValue,
      matchMode = "",
      matchModeDics,
      selectorConditions,
      paramTypeDics,
      operatorDics
    } = this.props;
    let disable = id !== undefined;
    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        sm: { span: 7 }
      },
      wrapperCol: {
        sm: { span: 17 }
      }
    };
    if (config) {
      config = JSON.parse(config);
    }
    return (
      <Modal
        width={640}
        centered
        title={getIntlContent("SHENYU.PLUGIN")}
        visible
        okText={getIntlContent("SHENYU.COMMON.SURE")}
        cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
        onOk={this.handleSubmit}
        onCancel={handleCancel}
      >
        <Form onSubmit={this.handleSubmit} className="login-form">
          <FormItem label={getIntlContent("SHENYU.MENU.SERVICE.MANAGEMENT.NAME")} {...formItemLayout}>
            {getFieldDecorator("name", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.PLUGIN.SELECT")
                }
              ],
              initialValue: name
            })(
              <Input
                placeholder={getIntlContent("SHENYU.MENU.SERVICE.MANAGEMENT.NAME")}
                // disabled={disable}
              />
            )}
          </FormItem>
          {data &&
            data.length > 0 && (
              <Fragment>
                <Divider>
                  {name} {getIntlContent("SHENYU.COMMON.SETTING")}
                </Divider>
                {data.map((eachField, index) => {
                  let fieldInitialValue = config
                    ? config[eachField.field]
                    : undefined;
                  let fieldName = eachField.field;
                  let dataType = eachField.dataType;
                  let required = "";
                  let checkRule;
                  if (eachField.extObj) {
                    let extObj = JSON.parse(eachField.extObj);
                    required = extObj.required === "0" ? "" : extObj.required;
                    if (!fieldInitialValue) {
                      fieldInitialValue = extObj.defaultValue;
                    }
                    if (extObj.rule) {
                      checkRule = extObj.rule;
                    }
                  }
                  let rules = [];
                  if (required) {
                    rules.push({
                      required: { required },
                      message: getIntlContent("SHENYU.COMMON.PLEASEINPUT")
                    });
                  }
                  if (checkRule) {
                    rules.push({
                      // eslint-disable-next-line no-eval
                      pattern: eval(checkRule),
                      message: `${getIntlContent(
                        "SHENYU.PLUGIN.RULE.INVALID"
                      )}:(${checkRule})`
                    });
                  }
                  if (dataType === 1) {
                    return (
                      <FormItem
                        label={eachField.label}
                        {...formItemLayout}
                        key={index}
                      >
                        {getFieldDecorator(fieldName, {
                          rules,
                          initialValue: fieldInitialValue
                        })(
                          <Input placeholder={eachField.label} type="number" />
                        )}
                      </FormItem>
                    );
                  } else if (dataType === 3 && eachField.dictOptions) {
                    return (
                      <FormItem
                        label={eachField.label}
                        {...formItemLayout}
                        key={index}
                      >
                        {getFieldDecorator(fieldName, {
                          rules,
                          initialValue: fieldInitialValue
                        })(
                          <Select placeholder={eachField.label}>
                            {eachField.dictOptions.map(option => {
                              return (
                                <Option
                                  key={option.dictValue}
                                  value={option.dictValue}
                                >
                                  {option.dictName} ({eachField.label})
                                </Option>
                              );
                            })}
                          </Select>
                        )}
                      </FormItem>
                    );
                  } else {
                    return (
                      <FormItem
                        label={eachField.label}
                        {...formItemLayout}
                        key={index}
                      >
                        {getFieldDecorator(fieldName, {
                          rules,
                          initialValue: fieldInitialValue
                        })(<Input placeholder={eachField.label} />)}
                      </FormItem>
                    );
                  }
                })}
                <Divider />
              </Fragment>
            )}
          <FormItem
            label={getIntlContent("SHENYU.SYSTEM.ROLE")}
            {...formItemLayout}
          >
            {getFieldDecorator("role", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.SYSTEM.SELECTROLE")
                }
              ],
              initialValue: role
            })(<Input maxLength={50} />)}
          </FormItem>
          {selectValue !== "0" && (
            <Fragment>
              <FormItem
                label={getIntlContent("SHENYU.COMMON.MATCHTYPE")}
                {...formItemLayout}
              >
                {getFieldDecorator("matchMode", {
                  rules: [
                    {
                      required: true,
                      message: getIntlContent("SHENYU.COMMON.INPUTMATCHTYPE")
                    }
                  ],
                  initialValue: `${matchMode}`
                })(
                  <Select
                    placeholder={getIntlContent("SHENYU.COMMON.MATCHTYPE")}
                  >
                    {matchModeDics &&
                    matchModeDics.map(item => {
                      return (
                        <Option key={item.dictValue} value={item.dictValue}>
                          {item.dictName}
                        </Option>
                      );
                    })}
                  </Select>
                )}
              </FormItem>
              <div className={styles.condition}>
                <h3 className={styles.header}>
                  <strong>*</strong>
                  {getIntlContent("SHENYU.COMMON.CONDITION")}:{" "}
                </h3>
                <div>
                  {selectorConditions.map((item, index) => {
                    return (
                      <ul key={index}>
                        <li>
                          <Select
                            onChange={value => {
                              this.conditionChange(index, "paramType", value);
                            }}
                            value={item.paramType}
                            style={{ width: 120 }}
                          >
                            {paramTypeDics &&
                            paramTypeDics.map(typeItem => {
                              return (
                                <Option
                                  key={typeItem.dictValue}
                                  value={typeItem.dictValue}
                                >
                                  {typeItem.dictName}
                                </Option>
                              );
                            })}
                          </Select>
                        </li>
                        <li
                          style={{
                            display: this.state[`paramTypeValueEn${index}`]
                              ? "none"
                              : "block"
                          }}
                        >
                          <Input
                            onChange={e => {
                              this.conditionChange(
                                index,
                                "paramName",
                                e.target.value
                              );
                            }}
                            value={item.paramName}
                            style={{ width: 100 }}
                          />
                        </li>
                        <li>
                          <Select
                            onChange={value => {
                              this.conditionChange(index, "operator", value);
                            }}
                            value={item.operator}
                            style={{ width: 150 }}
                          >
                            {operatorDics &&
                            operatorDics.map(opearte => {
                              return (
                                <Option
                                  key={opearte.dictValue}
                                  value={opearte.dictValue}
                                >
                                  {opearte.dictName}
                                </Option>
                              );
                            })}
                          </Select>
                        </li>

                        <li>
                          <Tooltip title={item.paramValue}>
                            <Input
                              onChange={e => {
                                this.conditionChange(
                                  index,
                                  "paramValue",
                                  e.target.value
                                );
                              }}
                              value={item.paramValue}
                              style={{ width: 300 }}
                            />
                          </Tooltip>
                        </li>
                        <li>
                          <Button
                            type="danger"
                            onClick={() => {
                              this.handleDelete(index);
                            }}
                          >
                            {getIntlContent("SHENYU.COMMON.DELETE.NAME")}
                          </Button>
                        </li>
                      </ul>
                    );
                  })}
                </div>

                <Button onClick={this.handleAdd} type="primary">
                  {getIntlContent("SHENYU.COMMON.ADD")}
                </Button>
              </div>
            </Fragment>
          )}
          <FormItem
            label={getIntlContent("SHENYU.PLUGIN.SORT")}
            {...formItemLayout}
          >
            {getFieldDecorator("sort", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.PLUGIN.INPUTSORT")
                }
              ],
              initialValue: sort
            })(
              <InputNumber
                precision={0}
                style={{ width: "100%" }}
              />
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
            label={getIntlContent("SHENYU.SYSTEM.STATUS")}
          >
            {getFieldDecorator("enabled", {
              initialValue: enabled,
              valuePropName: "checked"
            })(<Switch />)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

export default Form.create()(AddModal);
