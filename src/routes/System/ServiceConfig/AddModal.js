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
import {Modal,
  Form,
  Select,
  Input,
  Switch,
  Button,
  message,
  Tooltip,
  Popconfirm,
  Row,
  Col,
  Card,
  Icon,
  InputNumber,
  TreeSelect,
} from "antd";
import { connect } from "dva";
import classnames from "classnames";
import styles from "./Modal.less";
import { getIntlContent } from "../../../utils/IntlUtils";

const FormItem = Form.Item;
const { Option } = Select;
const { SHOW_CHILD } = TreeSelect;

const formItemLayout = {
  labelCol: { sm: { span: 3 } },
  wrapperCol: { sm: { span: 21 } }
};
const formCheckLayout = {
  labelCol: { sm: { span: 18 } },
  wrapperCol: { sm: { span: 4 } }
};

let id = 0;

@connect(({ plugin, pluginHandle, shenyuDict }) => ({
  plugin,
  pluginHandle,
  // platform: global.platform,
  shenyuDict
}))
class AddModal extends Component {
  constructor(props) {
    super(props);
    const { handle, pluginId } = props;
    let selectValue = `${props.type}` || null;
    let data = {};
    if (handle) {
      try {
        data = JSON.parse(handle);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      }
    }

    const { divideUpstreams = [], gray = false, serviceId = "" } = data;

    if (pluginId === "8") {
      id = divideUpstreams.length;
    }

    this.state = {
      selectValue,
      gray,
      serviceId,
      divideUpstreams,

      visible: false
    };

    this.initSelectorCondtion(props);
    this.initDics();
  }

  componentWillMount() {
    const { dispatch } = this.props;
    dispatch({
      type: "plugin/fetchEnabledPlugins",
      payload: {
        callBack: (enablePlugins) => {
          this.generateTreeData(enablePlugins)
        }
      }
    });
  }

  /**
   * generate plugin tree
   * @param enabledPlugins
   */
  generateTreeData = (enabledPlugins) => {
    let treeData = [];
    Object.keys(enabledPlugins).forEach(resultKey => {
      let treeNode = {};
      treeNode.title = resultKey;
      treeNode.value = resultKey;
      treeNode.key = resultKey;
      let resultValue = enabledPlugins[resultKey];
      let childNodes = [];
      resultValue.forEach((currentValue) => {
        let childNode = {};
        childNode.title = currentValue.name;
        childNode.key = currentValue.id;
        childNode.value = currentValue.id;
        childNode.plugin = currentValue;
        childNodes.push(childNode)
      });
      treeNode.children = childNodes;
      treeData.push(treeNode)
    });
    this.state.treeData = treeData;
  }

  initSelectorCondtion = props => {
    const selectorConditions = props.selectorConditions || [
      {
        paramType: "uri",
        operator: "=",
        paramName: "/",
        paramValue: ""
      }
    ];
    selectorConditions.forEach((item, index) => {
      const { paramType } = item;
      let key = `paramTypeValueEn${index}`;
      if (paramType === "uri" || paramType === "host" || paramType === "ip") {
        this.state[key] = true;
        selectorConditions[index].paramName = "/";
      } else {
        this.state[key] = false;
      }
    });
    this.state.selectorConditions = selectorConditions;
  };

  initDics = () => {
    this.initDic("operator");
    this.initDic("matchMode");
    this.initDic("paramType");
  };

  initDic = type => {
    const { dispatch } = this.props;
    dispatch({
      type: "shenyuDict/fetchByType",
      payload: {
        type,
        callBack: dics => {
          this.state[`${type}Dics`] = dics;
        }
      }
    });
  };

  checkConditions = selectorConditions => {
    let result = true;
    if (selectorConditions) {
      selectorConditions.forEach((item, index) => {
        const { paramType, operator, paramName, paramValue } = item;
        if (!paramType || !operator || !paramValue) {
          message.destroy();
          message.error(`Line ${index + 1} condition is incomplete`);
          result = false;
        }
        if (paramType === "uri" || paramType === "host" || paramType === "ip") {
          // aaa
        } else {
          // eslint-disable-next-line no-lonely-if
          if (!paramName) {
            message.destroy();
            message.error(`Line ${index + 1} condition is incomplete`);
            result = false;
          }
        }
      });
    } else {
      message.destroy();
      message.error(`Incomplete condition`);
      result = false;
    }
    return result;
  };

  judgeObject = (obj) => {
    if (obj === null || typeof obj === "undefined" || obj === "") {
      return null;
    } else {
      return obj;
    }
  }

  getMultiSelectorHandle = (pluginDetail) => {
    if (pluginDetail === null || typeof pluginDetail === "undefined") { return null }
    let pluginConfig = pluginDetail.config;
    if (this.judgeObject(pluginConfig) === null) {
      return null;
    } else {
      let configJson = JSON.parse(pluginConfig);
      return Object.keys(configJson).includes("multiSelectorHandle") === true ? configJson.multiSelectorHandle : null;
    }
  }

  // mock data:
  // todo 2020/5/10 submit button
  handleSubmit = e => {
    e.preventDefault();
    const { form, handleOk} = this.props;
    const { selectorConditions, selectValue, selectedPluginHandleList } = this.state;

    let serviceConfig = {};

    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        const mySubmit = selectValue !== "0" && this.checkConditions(selectorConditions);
        if (mySubmit || selectValue === "0") {
          serviceConfig.serviceName = this.props.form.getFieldValue("serviceName");
          serviceConfig.selectors = [];
          selectedPluginHandleList.forEach((pluginDetail) => {
            let pluginSelector = {type: "1", pluginId: pluginDetail.pluginId};
            pluginSelector.name = this.props.form.getFieldValue("serviceName");
            pluginSelector.matchMode = this.props.form.getFieldValue("matchMode");
            pluginSelector.continued = this.props.form.getFieldValue("continued");
            pluginSelector.loged = this.props.form.getFieldValue("loged");
            pluginSelector.enabled = this.props.form.getFieldValue("enabled");
            pluginSelector.sort = this.props.form.getFieldValue("sort");
            pluginSelector.selectorConditions = selectorConditions;
            let handle = [];
            pluginDetail.pluginHandleList.forEach((handleList, index) => {
              handle[index] = {};
              handleList.forEach(item => {
                if (item.pluginId === "8") {
                  const { keys, divideUpstreams } = values;
                  const data = {
                    [item.field]: values[item.field],
                    gray: values.gray
                  };

                  if (Array.isArray(divideUpstreams) && divideUpstreams.length) {
                    data.divideUpstreams = keys.map(key => divideUpstreams[key]);
                  }
                  handle[index] = data;
                  delete values[item.field];
                  delete values.divideUpstreams;
                  delete values.gray;
                  delete values.key;
                }
                else {
                  handle[index][item.field] = values[item.field + index + pluginDetail.pluginId];
                  delete values[item.field + index + pluginDetail.pluginId];
                }
              });
            });
            pluginSelector.handle = this.getMultiSelectorHandle(pluginDetail.pluginDetail) === "1"
              ? JSON.stringify(handle)
              : JSON.stringify(handle[0]);
            serviceConfig.selectors.push(pluginSelector);
          })
          handleOk({
            serviceConfig,
          });
        }
      }
    });
  };

  handleAdd = () => {
    let { selectorConditions } = this.state;
    selectorConditions.push({
      paramType: "uri",
      operator: "=",
      paramName: "/",
      paramValue: ""
    });
    this.setState({ selectorConditions }, () => {
      let len = selectorConditions.length || 0;
      let key = `paramTypeValueEn${len - 1}`;

      this.setState({ [key]: true });
    });
  };

  handleDelete = index => {
    let { selectorConditions } = this.state;
    if (selectorConditions && selectorConditions.length > 1) {
      selectorConditions.splice(index, 1);
    } else {
      message.destroy();
      message.error("At least one condition");
    }
    this.setState({ selectorConditions });
  };

  handleAddHandle = (pluginId, event) => {
    console.log(event)
    // query pluginHandleList by pluginId from select
    let { selectedPluginHandleList } = this.state;
    let currentPlugin = selectedPluginHandleList.find((x) => x.pluginId === pluginId);
    let currentPluginHandleList = currentPlugin.pluginHandleList;
    let pluginHandle = currentPlugin.pluginHandleList[0];
    let toAddPluginHandle = pluginHandle.map(e => {
      return { ...e, value: null };
    });
    currentPluginHandleList.push(toAddPluginHandle);
    this.setState({
      selectedPluginHandleList
    });
  };

  handleDeleteHandle = (pluginId, index) => {
    let { selectedPluginHandleList } = this.state;
    let currentPlugin = selectedPluginHandleList.find((x) => x.pluginId === pluginId);
    let currentPluginHandleList = currentPlugin.pluginHandleList;
    if (currentPluginHandleList.length === 1) {
      message.destroy();
      message.error(getIntlContent("SHENYU.PLUGIN.HANDLE.TIP"));
    } else {
      currentPluginHandleList.splice(index, 1);
      this.setState({ selectedPluginHandleList });
    }
  };

  conditionChange = (index, name, value) => {
    let { selectorConditions } = this.state;
    selectorConditions[index][name] = value;

    if (name === "paramType") {
      let key = `paramTypeValueEn${index}`;
      if (value === "uri" || value === "host" || value === "ip") {
        this.setState({ [key]: true });
        selectorConditions[index].paramName = "/";
      } else {
        this.setState({ [key]: false });
      }
    }

    this.setState({ selectorConditions });
  };

  getSelectValue = value => {
    this.setState({
      selectValue: value
    });
  };

  renderPluginHandler = (plugin) => {
    if (this.state.selectedPluginHandleList === undefined) {
      return null;
    }
    let pluginHandleList = plugin.pluginHandleList;
    let pluginName = plugin.pluginName;
    let pluginId = plugin.pluginId;
    let multiSelectorHandle = this.getMultiSelectorHandle(plugin.pluginDetail)
    const { divideUpstreams, gray, serviceId } = this.state;
    const {
      form: { getFieldDecorator, getFieldValue, setFieldsValue },
    } = this.props;
    const labelWidth = 75;

    if (pluginId === "8") {
      getFieldDecorator("keys", {
        initialValue: Array.from({
          length: divideUpstreams.length
        }).map((_, i) => i)
      });
      const keys = getFieldValue("keys");
      const Rule = keys.map((key, index) => (
        <FormItem
          required
          key={key}
          {...(index === 0
            ? { labelCol: { span: 3 }, wrapperCol: { span: 21 } }
            : { wrapperCol: { span: 21, offset: 3 } })}
          label={index === 0 ? "divideUpstreams" : ""}
        >
          <Card>
            <div style={{ display: "flex", alignItems: "center" }}>
              <Row gutter={8}>
                <Col span={8}>
                  <FormItem
                    label="protocol"
                    labelCol={{ span: 8 }}
                    wrapperCol={{ span: 16 }}
                  >
                    {getFieldDecorator(`divideUpstreams[${key}].protocol`, {
                      initialValue: divideUpstreams[key]
                        ? divideUpstreams[key].protocol
                        : "",
                      rules: [
                        {
                          required: true,
                          message: "protocol is required"
                        }
                      ]
                    })(<Input />)}
                  </FormItem>
                </Col>
                <Col span={16}>
                  <FormItem
                    label="upstreamUrl"
                    labelCol={{ span: 5 }}
                    wrapperCol={{ span: 19 }}
                  >
                    {getFieldDecorator(`divideUpstreams[${key}].upstreamUrl`, {
                      initialValue: divideUpstreams[key]
                        ? divideUpstreams[key].upstreamUrl
                        : "",
                      rules: [
                        {
                          required: true,
                          message: "upstreamUrl is required"
                        }
                      ]
                    })(<Input />)}
                  </FormItem>
                </Col>
                <Col span={6}>
                  <FormItem
                    label="weight"
                    labelCol={{ span: 9 }}
                    wrapperCol={{ span: 15 }}
                  >
                    {getFieldDecorator(`divideUpstreams[${key}].weight`, {
                      initialValue: divideUpstreams[key]
                        ? divideUpstreams[key].weight
                        : "",
                      rules: [
                        {
                          required: true,
                          message: "weight is required"
                        }
                      ]
                    })(
                      <InputNumber
                        min={0}
                        max={100}
                        style={{ width: "100%" }}
                      />
                    )}
                  </FormItem>
                </Col>

                <Col span={4}>
                  <FormItem
                    label="status"
                    labelCol={{ span: 13 }}
                    wrapperCol={{ span: 11 }}
                  >
                    {getFieldDecorator(`divideUpstreams[${key}].status`, {
                      initialValue: divideUpstreams[key]
                        ? divideUpstreams[key].status
                        : false,
                      valuePropName: "checked",
                      rules: [
                        {
                          required: true,
                          message: "status is required"
                        }
                      ]
                    })(<Switch />)}
                  </FormItem>
                </Col>

                <Col span={8}>
                  <FormItem
                    label="timestamp"
                    labelCol={{ span: 9 }}
                    wrapperCol={{ span: 15 }}
                  >
                    {getFieldDecorator(`divideUpstreams[${key}].timestamp`, {
                      initialValue: divideUpstreams[key]
                        ? divideUpstreams[key].timestamp
                        : "",
                      rules: [
                        {
                          required: true,
                          message: "timestamp is required"
                        }
                      ]
                    })(<InputNumber style={{ width: "100%" }} />)}
                  </FormItem>
                </Col>

                <Col span={6}>
                  <FormItem
                    label="warmup"
                    labelCol={{ span: 10 }}
                    wrapperCol={{ span: 14 }}
                  >
                    {getFieldDecorator(`divideUpstreams[${key}].warmup`, {
                      initialValue: divideUpstreams[key]
                        ? divideUpstreams[key].warmup
                        : "",
                      rules: [
                        {
                          required: true,
                          message: "warmup is required"
                        }
                      ]
                    })(<InputNumber style={{ width: "100%" }} />)}
                  </FormItem>
                </Col>
              </Row>
              <div style={{ width: 64, textAlign: "right" }}>
                <Icon
                  onClick={() => {
                    setFieldsValue({
                      keys: keys.filter(k => k !== key)
                    });
                  }}
                  type="minus-circle-o"
                  style={{
                    fontSize: 18,
                    color: "#ff0000",
                    cursor: "pointer"
                  }}
                />
              </div>
            </div>
          </Card>
        </FormItem>
      ));

      return (
        <Row gutter={16} key="8">
          <Col span={10}>
            <FormItem
              label="serviceId"
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 16 }}
            >
              {getFieldDecorator("serviceId", {
                initialValue: serviceId,
                rules: [
                  {
                    required: true
                  }
                ]
              })(<Input placeholder="serviceId" />)}
            </FormItem>
          </Col>
          <Col span={8}>
            <FormItem
              label="gray"
              labelCol={{ span: 4 }}
              wrapperCol={{ span: 16 }}
            >
              {getFieldDecorator("gray", {
                valuePropName: "checked",
                initialValue: gray,
                rules: [
                  {
                    required: true
                  }
                ]
              })(<Switch />)}
            </FormItem>
          </Col>
          <Col span={24}>
            {Rule}
            <FormItem wrapperCol={{ span: 16, offset: 3 }}>
              <Button
                type="dashed"
                onClick={() => {
                  const keysData = getFieldValue("keys");
                  // eslint-disable-next-line no-plusplus
                  const nextKeys = keysData.concat(id++);
                  setFieldsValue({
                    keys: nextKeys
                  });
                }}
              >
                <Icon type="plus" /> Add divide upstream
              </Button>
            </FormItem>
          </Col>
        </Row>
      );
    }

    if (Array.isArray(pluginHandleList) && pluginHandleList.length) {
      return (
        <div className={styles.handleWrap}>
          <div className={styles.header}>
            <h3 style={{ width: 100 }}>
              {pluginName} - {getIntlContent("SHENYU.COMMON.DEAL")}:{" "}
            </h3>
          </div>
          <div>
            {pluginHandleList.map((handleList, index) => {
              return (
                <div
                  key={index + pluginId}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    flexDirection: "row"
                  }}
                >
                  <ul
                    className={classnames({
                      [styles.handleUl]: true,
                      [styles.handleSelectorUl]: true,
                      [styles.springUl]: true
                    })}
                    style={{ width: "100%" }}
                  >
                    {handleList &&
                    handleList.map((item) => {
                      let required = item.required === "1";
                      let defaultValue =
                        item.value === 0 || item.value === false
                          ? item.value
                          : item.value ||
                          (item.defaultValue === "true"
                            ? true
                            : item.defaultValue === "false"
                              ? false
                              : item.defaultValue);
                      let placeholder = item.placeholder || item.label;
                      let checkRule = item.checkRule;
                      let fieldName = item.field + index + pluginId;
                      let rules = [];
                      if (required) {
                        rules.push({
                          required: { required },
                          message:
                            getIntlContent("SHENYU.COMMON.PLEASEINPUT") +
                            item.label
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
                      if (item.dataType === 1) {
                        return (
                          <li key={fieldName}>
                            <Tooltip title={placeholder}>
                              <FormItem>
                                {getFieldDecorator(fieldName, {
                                  rules,
                                  initialValue: defaultValue
                                })(
                                  <Input
                                    addonBefore={
                                      <div style={{ width: labelWidth }}>
                                        {item.label}
                                      </div>
                                    }
                                    placeholder={placeholder}
                                    key={fieldName}
                                    type="number"
                                    onChange={e=> {
                                      this.onDealChange(
                                        e.target.value,
                                        item
                                      );
                                    }}
                                  />
                                )}
                              </FormItem>
                            </Tooltip>
                          </li>
                        );
                      } else if (item.dataType === 3 && item.dictOptions) {
                        return (
                          <li key={fieldName}>
                            <Tooltip title={placeholder}>
                              <FormItem>
                                {getFieldDecorator(fieldName, {
                                  rules,
                                  initialValue: defaultValue
                                })(
                                  <Select
                                    placeholder={placeholder}
                                    style={{ width: "100%" }}
                                  >
                                    {item.dictOptions.map(option => {
                                      return (
                                        <Option
                                          key={option.dictValue}
                                          value={
                                            option.dictValue === "true"
                                              ? true
                                              : option.dictValue === "false"
                                              ? false
                                              : option.dictValue
                                          }
                                        >
                                          {option.dictName} ({item.label})
                                        </Option>
                                      );
                                    })}
                                  </Select>
                                )}
                              </FormItem>
                            </Tooltip>
                          </li>
                        );
                      } else {
                        return (
                          <li key={fieldName}>
                            <Tooltip title={item.value}>
                              <FormItem>
                                {getFieldDecorator(fieldName, {
                                  rules,
                                  initialValue: defaultValue
                                })(
                                  <Input
                                    addonBefore={
                                      <div style={{ width: labelWidth }}>
                                        {item.label}
                                      </div>
                                    }
                                    placeholder={placeholder}
                                    key={fieldName}
                                    onChange={e=> {
                                      this.onDealChange(
                                        e.target.value,
                                        item
                                      );
                                    }}
                                  />
                                )}
                              </FormItem>
                            </Tooltip>
                          </li>
                        );
                      }
                    })}
                  </ul>
                  {multiSelectorHandle && (
                    <div style={{ width: 80, marginTop: 3 }}>
                      <Popconfirm
                        title={getIntlContent("SHENYU.COMMON.DELETE")}
                        placement="bottom"
                        onCancel={e => {
                          e.stopPropagation();
                        }}
                        onConfirm={e => {
                          e.stopPropagation();
                          this.handleDeleteHandle(pluginId, index);
                        }}
                        okText={getIntlContent("SHENYU.COMMON.SURE")}
                        cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
                      >
                        <Button type="danger">
                          {getIntlContent("SHENYU.COMMON.DELETE.NAME")}
                        </Button>
                      </Popconfirm>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {multiSelectorHandle && (
            <div style={{ width: 80, marginTop: 3, marginLeft: 5 }}>
              <Button onClick={e => {this.handleAddHandle(pluginId, pluginName, e)}} type="primary">
                {getIntlContent("SHENYU.COMMON.ADD")}
              </Button>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  onDealChange = (value,item) => {
    item.value = value;
  };

  onPluginChange = (activePlugin) => {
    let { selectedPluginHandleList } = this.state;
    let currentArr = selectedPluginHandleList || [];
    let newArr = currentArr.filter((x) => activePlugin.some((item) => x.pluginId === item))
    this.setState({
      selectedPluginHandleList: newArr
    });
  }

  onPluginSelect = (value, node) => {
    this.queryPluginHandler(node.props.value, node.props.title, node.props.plugin);
  }

  queryPluginHandler = (pluginId, pluginName, pluginDetail) => {
    const { dispatch, handle} = this.props;
    let type = 1;
    let multiSelectorHandle = this.getMultiSelectorHandle(pluginDetail) || true;
    dispatch({
      type: "pluginHandle/fetchByPluginId",
      payload: {
        pluginId,
        type,
        handle,
        isHandleArray: multiSelectorHandle,
        callBack: pluginHandles => {
          this.setPluginHandleList(pluginId, pluginName, pluginHandles, pluginDetail);
        }
      }
    });
  }

  setPluginHandleList = (pluginId, pluginName, pluginHandles, pluginDetail) => {
    let { selectedPluginHandleList } = this.state;
    let currentPlugin = {pluginId, pluginName, pluginHandleList: pluginHandles, pluginDetail}
    const currentArr = selectedPluginHandleList || [];
    // select plugin update local selectedPluginHandleList
    this.setState({
      selectedPluginHandleList: [...currentArr, currentPlugin]
    })
  };

  render() {
    let {
      onCancel,
      form,
      serviceName = "",
      // platform,
      matchMode = "",
      continued = true,
      loged = true,
      enabled = true,
      sort
    } = this.props;

    const {
      selectorConditions,
      selectValue,
      selectedPluginHandleList,
      operatorDics,
      matchModeDics,
      paramTypeDics,
      visible,
      treeData,
      selectPlugin,
    } = this.state;

    // type = `${type}`;
    // let { selectorTypeEnums } = platform;

    const { getFieldDecorator } = this.props.form;

    return (
      <Modal
        width={1300}
        centered
        title={getIntlContent("SHENYU.SERVICE")}
        visible
        okText={getIntlContent("SHENYU.COMMON.SURE")}
        cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
        onOk={this.handleSubmit}
        onCancel={onCancel}
      >
        <Form onSubmit={this.handleSubmit} className="login-form">
          <FormItem label={getIntlContent("SHENYU.MENU.SERVICE.MANAGEMENT.NAME")} {...formItemLayout}>
            {getFieldDecorator("serviceName", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.SERVICE.NAME")
                }
              ],
              initialValue: serviceName
            })(
              <Input
                placeholder={getIntlContent("SHENYU.MENU.SERVICE.MANAGEMENT.NAME")}
                // disabled={disable}
              />
            )}
          </FormItem>
          <FormItem label={getIntlContent("SHENYU.MENU.SERVICE.MANAGEMENT.PLUGIN")} {...formItemLayout}>
            {getFieldDecorator("selectPlugin", {
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.PLUGIN.SELECT")
                }
              ],
              initialValue: selectPlugin
            })(
              <TreeSelect
                treeData={treeData}
                showSearch
                showCheckedStrategy={SHOW_CHILD}
                style={{ width: '100%' }}
                value={selectPlugin}
                treeCheckable={true}
                dropdownStyle={{ maxHeight: 200, overflow: 'auto' }}
                placeholder="Please select"
                allowClear
                multiple
                treeDefaultExpandAll
                onChange={this.onPluginChange}
                onSelect={this.onPluginSelect}
              />
            )}
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
                            style={{ width: 100 }}
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
          <div className={styles.layout}>
            <FormItem
              {...formCheckLayout}
              label={getIntlContent("SHENYU.SELECTOR.CONTINUE")}
            >
              {getFieldDecorator("continued", {
                initialValue: continued,
                valuePropName: "checked",
                rules: [{ required: true }]
              })(<Switch />)}
            </FormItem>
            <FormItem
              style={{ margin: "0 30px" }}
              {...formCheckLayout}
              label={getIntlContent("SHENYU.SELECTOR.PRINTLOG")}
            >
              {getFieldDecorator("loged", {
                initialValue: loged,
                valuePropName: "checked",
                rules: [{ required: true }]
              })(<Switch />)}
            </FormItem>
            <FormItem
              {...formCheckLayout}
              label={getIntlContent("SHENYU.SELECTOR.WHETHEROPEN")}
            >
              {getFieldDecorator("enabled", {
                initialValue: enabled,
                valuePropName: "checked",
                rules: [{ required: true }]
              })(<Switch />)}
            </FormItem>
          </div>
          {selectedPluginHandleList === undefined ? null : selectedPluginHandleList.map((item) =>
            this.renderPluginHandler(item))}
          <FormItem
            label={getIntlContent("SHENYU.SELECTOR.EXEORDER")}
            {...formItemLayout}
          >
            {getFieldDecorator("sort", {
              initialValue: sort,
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.SELECTOR.INPUTNUMBER")
                },
                {
                  pattern: /^([1-9][0-9]{0,2}|1000)$/,
                  message: getIntlContent("SHENYU.SELECTOR.INPUTNUMBER")
                }
              ]
            })(
              <Input
                placeholder={getIntlContent("SHENYU.SELECTOR.INPUTORDER")}
              />
            )}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

export default Form.create()(AddModal);
