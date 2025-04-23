'use client'

import { Popup, Form, Input, Button, Selector, Space, TextArea, Stepper, Picker } from 'antd-mobile'
import { CloseOutline } from 'antd-mobile-icons'
import { useState, useEffect } from 'react'
import { minerService } from '../services/miner-service'
import { Toast } from 'antd-mobile'
import Loading from '../components/Loading'

interface Pool {
  id: string
  name: string
  logo: string
  description: string
}

interface ExpandableTextProps {
  text: string
  maxLines?: number
}

function ExpandableText({ text, maxLines = 3 }: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="relative">
      <p
        className={`text-gray-500 text-sm mt-1 ${!isExpanded ? 'line-clamp-2' : ''}`}
      >
        <div dangerouslySetInnerHTML={{ __html: text }} />
      </p>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-[#1677FF] text-xs mt-0.5"
      >
        {isExpanded ? '收起' : '展开'}
      </button>
    </div>
  )
}

interface Props {
  visible: boolean
  onClose: () => void
  onSubmit: (values: any) => void
  miner: {
    id: string
    title: string
    image: string
    description: string
    price: number
    MPQ: number
  }
}

export default function BuyForm({ visible, onClose, onSubmit, miner }: Props) {
  const [form] = Form.useForm()
  const [pools, setPools] = useState<Pool[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedCountryCode, setSelectedCountryCode] = useState('+86')
  const [showCountryPicker, setShowCountryPicker] = useState(false)

  useEffect(() => {
    if (visible) {
      fetchPools()
    } else {
      // 关闭时重置表单
      form.resetFields()
    }
  }, [visible])

  const fetchPools = async () => {
    try {
      setLoading(true)
      const data: any = await minerService.getMiningPools()
      setPools(data?.records)
    } catch (error) {
      Toast.show({
        content: '获取矿池列表失败',
        icon: 'fail',
      })
    } finally {
      setLoading(false)
    }
  }

  const countryCodes = [
    { label: '中国大陆 +86', value: '+86' },
    { label: '中国香港 +852', value: '+852' },
    { label: '中国澳门 +853', value: '+853' },
    { label: '中国台湾 +886', value: '+886' },
    { label: '日本 +81', value: '+81' },
    { label: '韩国 +82', value: '+82' },
    { label: '新加坡 +65', value: '+65' },
    { label: '马来西亚 +60', value: '+60' },
    { label: '越南 +84', value: '+84' },
    { label: '泰国 +66', value: '+66' },
    { label: '美国/加拿大 +1', value: '+1' },
    { label: '英国 +44', value: '+44' },
    { label: '澳大利亚 +61', value: '+61' },
    { label: '新西兰 +64', value: '+64' },
    { label: '德国 +49', value: '+49' },
    { label: '法国 +33', value: '+33' },
    { label: '意大利 +39', value: '+39' },
    { label: '俄罗斯 +7', value: '+7' },
    { label: '印度 +91', value: '+91' },
    { label: '阿联酋 +971', value: '+971' },
  ]

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      // 添加国家/地区编号到手机号
      values.phone = `${selectedCountryCode}${values.phone}`
      await onSubmit(values)
    } catch (error) {
      console.log(error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Popup
      visible={visible}
      onMaskClick={onClose}
      position="bottom"
      bodyStyle={{ height: '90vh' }}
    >
      <div className="flex flex-col h-full bg-white">
        {/* 矿机信息 */}
        <div className="p-4 border-b relative">
          <div className="absolute right-4 top-[-30px]">
            <CloseOutline
              className="text-white text-xl"
              onClick={onClose}
            />
          </div>
          <div className="flex space-x-4">
            <img
              src={miner.image}
              alt={miner.title}
              className="w-20 h-20 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h3 className="text-md font-medium">{miner.title}</h3>
              {/* <ExpandableText text={miner.description} /> */}
              <div className="text-[#F5B544] text-lg mt-2">
                US ${miner.price}
              </div>
            </div>
          </div>
        </div>

        {/* 表单部分 */}
        <div className="flex-1 overflow-auto">
          <Form
            form={form}
            layout="horizontal"
            className="p-4"
            requiredMarkStyle="text-required"
            initialValues={{
              MPQ: miner.MPQ,
            }}
            footer={
              <Button
                block
                color="primary"
                size="large"
                onClick={handleSubmit}
                loading={submitting}
                disabled={submitting}
                className="!rounded-[10px] !border-none !bg-[#F5B544]"
              >
                立即购买
              </Button>
            }
          >
            <div className="mb-4">
              <div className="mb-2 px-4 py-2 text-[18px] text-[var(--adm-color-text-secondary)]">选择矿池</div>
              {loading ? <Loading /> :
                <Form.Item
                  name="poolId"
                  rules={[{ required: true, message: '请选择矿池' }]}
                  className="pb-0"
                >
                  <Selector
                    columns={1}
                    options={pools.map(pool => ({
                      label: (
                        <div className="flex items-start py-2">
                          <img src={pool.logo} alt={pool.name} className="w-8 h-8 mr-3 mt-0.5" />
                          <div className="flex-1 text-left">
                            <div className="font-medium text-base">{pool.name}</div>
                            <div className="text-sm text-gray-500 mt-1">{pool.description}</div>
                          </div>
                        </div>
                      ),
                      value: pool.id
                    }))}
                  />
                </Form.Item>
              }
            </div>

            <Form.Item
              name="quantity"
              label="购买数量"
              rules={[
                { required: true, message: '请输入购买数量' },
                { 
                  validator: (_, value) => {
                    if (value < miner.MPQ) {
                      return Promise.reject(`${miner.MPQ}台起订`)
                    }
                    return Promise.resolve()
                  }
                }
              ]}
              initialValue={miner.MPQ}
            >
              <Stepper
                min={miner.MPQ}
                className="!text-base"
                defaultValue={miner.MPQ}
              />
              <div className="text-sm text-gray-500 mt-1">
                {miner.MPQ}台起订
              </div>
            </Form.Item>

            <Form.Item
              name="receiver"
              label="收货人"
              rules={[{ required: true, message: '请输入收货人姓名' }]}
            >
              <Input placeholder="请填写收货人姓名" />
            </Form.Item>

            <Form.Item
              name="phone"
              label="手机号码"
              rules={[
                { required: true, },
                { 
                  validator: (_, value) => {
                    if (selectedCountryCode === '+86' && !/^1[3-9]\d{9}$/.test(value)) {
                      return Promise.reject('请输入正确的中国大陆手机号码')
                    }
                    if (selectedCountryCode === '+852' && !/^[5-9]\d{7}$/.test(value)) {
                      return Promise.reject('请输入正确的中国香港手机号码')
                    }
                    if (selectedCountryCode === '+853' && !/^[6]\d{7}$/.test(value)) {
                      return Promise.reject('请输入正确的中国澳门手机号码')
                    }
                    if (selectedCountryCode === '+886' && !/^[0-9]{9}$/.test(value)) {
                      return Promise.reject('请输入正确的中国台湾手机号码')
                    }
                    if (selectedCountryCode === '+81' && !/^[0-9]{10,11}$/.test(value)) {
                      return Promise.reject('请输入正确的日本手机号码')
                    }
                    if (selectedCountryCode === '+82' && !/^[0-9]{9,10}$/.test(value)) {
                      return Promise.reject('请输入正确的韩国手机号码')
                    }
                    if (selectedCountryCode === '+65' && !/^[8-9]\d{7}$/.test(value)) {
                      return Promise.reject('请输入正确的新加坡手机号码')
                    }
                    if (selectedCountryCode === '+60' && !/^1[0-9]{8,9}$/.test(value)) {
                      return Promise.reject('请输入正确的马来西亚手机号码')
                    }
                    if (selectedCountryCode === '+84' && !/^[0-9]{9,10}$/.test(value)) {
                      return Promise.reject('请输入正确的越南手机号码')
                    }
                    if (selectedCountryCode === '+66' && !/^[0-9]{9}$/.test(value)) {
                      return Promise.reject('请输入正确的泰国手机号码')
                    }
                    if (selectedCountryCode === '+1' && !/^[0-9]{10}$/.test(value)) {
                      return Promise.reject('请输入正确的美国/加拿大手机号码')
                    }
                    if (selectedCountryCode === '+44' && !/^[0-9]{10}$/.test(value)) {
                      return Promise.reject('请输入正确的英国手机号码')
                    }
                    if (selectedCountryCode === '+61' && !/^[0-9]{9}$/.test(value)) {
                      return Promise.reject('请输入正确的澳大利亚手机号码')
                    }
                    if (selectedCountryCode === '+64' && !/^[0-9]{9,10}$/.test(value)) {
                      return Promise.reject('请输入正确的新西兰手机号码')
                    }
                    if (selectedCountryCode === '+49' && !/^[0-9]{10,11}$/.test(value)) {
                      return Promise.reject('请输入正确的德国手机号码')
                    }
                    if (selectedCountryCode === '+33' && !/^[0-9]{9}$/.test(value)) {
                      return Promise.reject('请输入正确的法国手机号码')
                    }
                    if (selectedCountryCode === '+39' && !/^[0-9]{10,11}$/.test(value)) {
                      return Promise.reject('请输入正确的意大利手机号码')
                    }
                    if (selectedCountryCode === '+7' && !/^[0-9]{10}$/.test(value)) {
                      return Promise.reject('请输入正确的俄罗斯手机号码')
                    }
                    if (selectedCountryCode === '+91' && !/^[0-9]{10}$/.test(value)) {
                      return Promise.reject('请输入正确的印度手机号码')
                    }
                    if (selectedCountryCode === '+971' && !/^[0-9]{9}$/.test(value)) {
                      return Promise.reject('请输入正确的阿联酋手机号码')
                    }
                    return Promise.resolve()
                  }
                }
              ]}
            >
              <div className="flex items-center space-x-2">
                <div
                  className="px-3 py-2 border rounded-lg cursor-pointer"
                  onClick={() => setShowCountryPicker(true)}
                >
                  {selectedCountryCode}
                </div>
                <Input placeholder="请填写手机号码" type="tel" />
              </div>
            </Form.Item>

            <Popup
              visible={showCountryPicker}
              onMaskClick={() => setShowCountryPicker(false)}
              position="bottom"
              bodyStyle={{ height: '90vh' }}
            >
              <div className="p-4">
                <div className="text-lg font-medium mb-4">选择国家/地区</div>
                <Selector
                  columns={1}
                  options={countryCodes}
                  value={[selectedCountryCode]}
                  onChange={(arr) => {
                    setSelectedCountryCode(arr[0])
                    setShowCountryPicker(false)
                  }}
                />
              </div>
            </Popup>

            <Form.Item
              name="address"
              label="收货地址"
              rules={[{ required: true, message: '请输入详细地址' }]}
            >
              <TextArea
                placeholder="请填写详细地址"
                rows={3}
                className="!text-base"
              />
            </Form.Item>
            <Form.Item
              name="postcode"
              label="邮政编码"
              rules={[
                { pattern: /^[0-9]{6}$/, message: '请输入正确的邮政编码' }
              ]}
            >
              <Input placeholder="请填写邮政编码" />
            </Form.Item>
          </Form>
        </div>
      </div>
    </Popup>
  )
} 